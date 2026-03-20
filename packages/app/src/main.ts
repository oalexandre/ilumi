import { join, resolve } from "node:path";

import { app, BrowserWindow, ipcMain } from "electron";
import {
  Document,
  createDefaultRegistry,
  FunctionRegistry,
  PluginHost,
  PluginLoader,
} from "@engine/index";

const isDev = !app.isPackaged;
const unitRegistry = createDefaultRegistry();
const funcRegistry = new FunctionRegistry();
const pluginHost = new PluginHost(unitRegistry, funcRegistry);
const pluginLoader = new PluginLoader(pluginHost, {
  builtInDir: resolve(__dirname, "../../plugins/CommunityExtensions"),
});
const doc = new Document(unitRegistry);

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 480,
    minHeight: 320,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    webPreferences: {
      preload: join(__dirname, "../preload/preload.mjs"),
      sandbox: false,
    },
  });

  ipcMain.handle("numi:evaluate", (_event, source: string) => {
    return doc.update(source);
  });

  // Hot-reload plugins on window focus
  mainWindow.on("focus", () => {
    pluginLoader.reload();
  });

  if (isDev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  // Load plugins on startup
  pluginLoader.loadAll();

  createWindow();

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
