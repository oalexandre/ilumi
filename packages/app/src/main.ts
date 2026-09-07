import { join, resolve } from "node:path";

import { app, BrowserWindow, globalShortcut, ipcMain, nativeTheme, nativeImage } from "electron";
import { Document, createEntityRegistry, PluginHost, PluginLoader } from "@engine/index";
import type { EntityInfo, FormatOptions } from "@engine/index";

import { loadAllNotes, saveNote, deleteNote, generateId } from "./notes.js";
import type { NoteData } from "./notes.js";
import { createAppMenu } from "./menu.js";
import { getEffectiveSettings, loadSettings, saveSetting } from "./settings.js";
import type { AppSettings } from "./settings.js";
import { createTray } from "./tray.js";
import { setupAutoUpdater } from "./updater.js";

// Lets tests run against an isolated data directory instead of the user's real notes/settings.
const userDataOverride = process.env["ILUMI_USER_DATA"];
if (userDataOverride) {
  app.setPath("userData", userDataOverride);
}

const isDev = !app.isPackaged;
const entityRegistry = createEntityRegistry();
const pluginHost = new PluginHost(entityRegistry);
const pluginLoader = new PluginLoader(pluginHost, {
  builtInDir: resolve(import.meta.dirname, "../../plugins/CommunityPlugins"),
});
const doc = new Document(entityRegistry);

let mainWindow: BrowserWindow | null = null;

function getEffectiveTheme(): "dark" | "light" {
  const settings = loadSettings();
  if (settings.theme === "dark" || settings.theme === "light") return settings.theme;
  return nativeTheme.shouldUseDarkColors ? "dark" : "light";
}

function formatOptionsFromSettings(): FormatOptions {
  const settings = getEffectiveSettings();
  return {
    locale: settings.numberFormat,
    maxDecimals: settings.maxDecimals === "auto" ? undefined : settings.maxDecimals,
    useGrouping: settings.useGrouping,
  };
}

function applyFormatSettings(): void {
  doc.setFormatOptions(formatOptionsFromSettings());
}

function applyAlwaysOnTop(): void {
  if (!mainWindow) return;
  const { alwaysOnTop } = getEffectiveSettings();
  // "floating" keeps the window above normal windows; visibleOnAllWorkspaces lets it
  // appear over fullscreen apps on macOS, which is what a quick calculator wants.
  mainWindow.setAlwaysOnTop(alwaysOnTop, "floating");
  if (process.platform === "darwin") {
    mainWindow.setVisibleOnAllWorkspaces(alwaysOnTop, { visibleOnFullScreen: true });
  }
}

/** Show the window (restoring from tray) and focus it, or hide it if it's already focused. */
function toggleWindow(): void {
  if (!mainWindow) {
    createWindow();
    return;
  }
  if (mainWindow.isVisible() && mainWindow.isFocused()) {
    mainWindow.hide();
    return;
  }
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

/** Register the global shortcut from settings. Returns false if the OS refused it. */
function applyGlobalShortcut(): boolean {
  globalShortcut.unregisterAll();
  const { globalShortcut: accelerator } = getEffectiveSettings();
  if (!accelerator) return true;
  try {
    return globalShortcut.register(accelerator, toggleWindow);
  } catch {
    return false;
  }
}

function createWindow(): void {
  const iconPath = resolve(import.meta.dirname, "../../resources/icon-256.png");
  let icon: Electron.NativeImage | undefined;
  try {
    icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) icon = undefined;
  } catch {
    icon = undefined;
  }

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 480,
    minHeight: 320,
    icon,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    webPreferences: {
      preload: join(import.meta.dirname, "../preload/preload.mjs"),
      sandbox: false,
    },
  });

  ipcMain.handle("numi:evaluate", (_event, source: string) => {
    return doc.update(source);
  });

  ipcMain.handle("numi:getCompletions", (_event, unitPhrase: string) => {
    return entityRegistry.getUnitRegistry().getCompatiblePhrases(unitPhrase);
  });

  ipcMain.handle("numi:getAllUnits", () => {
    return entityRegistry.getUnitRegistry().getAllPhrases();
  });

  ipcMain.handle("numi:getEntityNames", (): EntityInfo[] => {
    return entityRegistry.getAllEntityInfo();
  });

  ipcMain.handle("numi:getHelpSections", () => {
    return entityRegistry.getHelpSections();
  });

  ipcMain.handle("numi:getConversionCompletions", (_event, sourceWord: string) => {
    return entityRegistry.getConversionCompletions(sourceWord);
  });

  ipcMain.handle("numi:resolveSourceWord", (_event, tokens: string[]) => {
    return entityRegistry.resolveSourceWord(tokens);
  });

  ipcMain.handle("numi:getTheme", () => {
    return getEffectiveTheme();
  });

  ipcMain.handle("numi:setTheme", (_event, theme: "auto" | "dark" | "light") => {
    saveSetting("theme", theme);
    const effective = getEffectiveTheme();
    mainWindow?.webContents.send("numi:themeChanged", effective);
    return effective;
  });

  ipcMain.handle("numi:getSettings", () => {
    return getEffectiveSettings();
  });

  ipcMain.handle("numi:getVersion", () => {
    return app.getVersion();
  });

  ipcMain.handle(
    "numi:setSetting",
    <K extends keyof AppSettings>(_event: unknown, key: K, value: AppSettings[K]) => {
      const previous = getEffectiveSettings()[key];
      saveSetting(key, value);
      let ok = true;
      switch (key) {
        case "globalShortcut":
          ok = applyGlobalShortcut();
          if (!ok) {
            // The OS refused the combination: keep the one that worked.
            saveSetting(key, previous);
            applyGlobalShortcut();
          }
          break;
        case "alwaysOnTop":
          applyAlwaysOnTop();
          break;
        case "numberFormat":
        case "maxDecimals":
        case "useGrouping":
          applyFormatSettings();
          break;
      }
      mainWindow?.webContents.send("numi:settingsChanged", getEffectiveSettings());
      return ok;
    },
  );

  ipcMain.handle("numi:getNotes", () => {
    return loadAllNotes();
  });

  ipcMain.handle("numi:saveNote", (_event, note: NoteData) => {
    saveNote(note);
  });

  ipcMain.handle("numi:createNote", () => {
    const note: NoteData = { id: generateId(), title: "Untitled", content: "" };
    saveNote(note);
    return note;
  });

  ipcMain.handle("numi:deleteNote", (_event, id: string) => {
    deleteNote(id);
  });

  ipcMain.handle("numi:toggleTheme", () => {
    const current = getEffectiveTheme();
    const next = current === "dark" ? "light" : "dark";
    saveSetting("theme", next);
    mainWindow?.webContents.send("numi:themeChanged", next);
    return next;
  });

  // Listen for OS theme changes
  nativeTheme.on("updated", () => {
    const settings = loadSettings();
    if (settings.theme === "auto" || !settings.theme) {
      const effective = getEffectiveTheme();
      mainWindow?.webContents.send("numi:themeChanged", effective);
    }
  });

  // Minimize to tray instead of quitting on close
  mainWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on("focus", () => {
    pluginLoader.reload();
    // Refresh parse options after plugin reload (new functions/units may have been added)
    doc.refreshParseOptions();
    mainWindow?.webContents.send("numi:entitiesChanged");
  });

  if (isDev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(import.meta.dirname, "../renderer/index.html"));
  }

  applyAlwaysOnTop();
}

// Track quit intent for close-to-tray behavior
app.isQuitting = false;
app.on("before-quit", () => {
  app.isQuitting = true;
});

app.name = "Ilumi";

app.whenReady().then(() => {
  pluginLoader.loadAll();

  // About panel with branding
  const iconForAbout = resolve(import.meta.dirname, "../../resources/icon-512.png");
  app.setAboutPanelOptions({
    applicationName: "Ilumi",
    applicationVersion: app.getVersion(),
    version: "",
    copyright: "© 2026 Ilumi. All rights reserved.",
    credits: "A smart calculator for everyday math.\nhttps://ilumi.oalexandre.com.br",
    iconPath: iconForAbout,
  });

  // Set dock icon on macOS so the About panel shows the Ilumi logo
  if (process.platform === "darwin") {
    const dockIcon = nativeImage.createFromPath(iconForAbout);
    if (!dockIcon.isEmpty()) {
      app.dock?.setIcon(dockIcon);
    }
  }
  // Rebuild parse options after all plugins are loaded
  doc.refreshParseOptions();
  applyFormatSettings();
  createAppMenu();
  createWindow();
  createTray(() => mainWindow);
  setupAutoUpdater(() => mainWindow);
  applyGlobalShortcut();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
