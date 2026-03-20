import { join, resolve } from "node:path";

import { app, BrowserWindow, ipcMain, nativeTheme } from "electron";
import {
  Document,
  createDefaultRegistry,
  FunctionRegistry,
  PluginHost,
  PluginLoader,
} from "@engine/index";

import { loadAllNotes, saveNote, deleteNote, generateId } from "./notes.js";
import type { NoteData } from "./notes.js";
import { createAppMenu } from "./menu.js";
import { loadSettings, saveSetting } from "./settings.js";
import { createTray } from "./tray.js";

const isDev = !app.isPackaged;
const unitRegistry = createDefaultRegistry();
const funcRegistry = new FunctionRegistry();
const pluginHost = new PluginHost(unitRegistry, funcRegistry);
const pluginLoader = new PluginLoader(pluginHost, {
  builtInDir: resolve(import.meta.dirname, "../../plugins/CommunityExtensions"),
});
const doc = new Document(unitRegistry);

let mainWindow: BrowserWindow | null = null;

function getEffectiveTheme(): "dark" | "light" {
  const settings = loadSettings();
  if (settings.theme === "dark" || settings.theme === "light") return settings.theme;
  return nativeTheme.shouldUseDarkColors ? "dark" : "light";
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 480,
    minHeight: 320,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    webPreferences: {
      preload: join(import.meta.dirname, "../preload/preload.mjs"),
      sandbox: false,
    },
  });

  ipcMain.handle("numi:evaluate", (_event, source: string) => {
    return doc.update(source);
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
  });

  if (isDev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(import.meta.dirname, "../renderer/index.html"));
  }
}

// Track quit intent for close-to-tray behavior
app.isQuitting = false;
app.on("before-quit", () => {
  app.isQuitting = true;
});

app.whenReady().then(() => {
  pluginLoader.loadAll();
  createAppMenu();
  createWindow();
  createTray(() => mainWindow);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
