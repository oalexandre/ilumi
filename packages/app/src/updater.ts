import { app, dialog, type BrowserWindow } from "electron";
import pkg from "electron-updater";
const { autoUpdater } = pkg;

const UPDATE_CHECK_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours

export function setupAutoUpdater(getWindow: () => BrowserWindow | null): void {
  // Don't check for updates in dev mode
  if (!app.isPackaged) return;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("update-available", (info) => {
    const win = getWindow();
    win?.webContents.send("numi:updateAvailable", info.version);
  });

  autoUpdater.on("update-downloaded", (info) => {
    const win = getWindow();
    if (!win) return;

    dialog
      .showMessageBox(win, {
        type: "info",
        title: "Update Ready",
        message: `Version ${info.version} has been downloaded.`,
        detail: "Restart now to apply the update?",
        buttons: ["Restart", "Later"],
        defaultId: 0,
        cancelId: 1,
      })
      .then(({ response }) => {
        if (response === 0) {
          app.isQuitting = true;
          autoUpdater.quitAndInstall();
        }
      });
  });

  autoUpdater.on("error", (err) => {
    console.error("Auto-updater error:", err.message);
  });

  // Check on startup (with small delay to not block launch)
  setTimeout(() => autoUpdater.checkForUpdates().catch(() => {}), 5000);

  // Check periodically
  setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), UPDATE_CHECK_INTERVAL);
}

/** Manually trigger an update check (for menu item) */
export function checkForUpdates(): void {
  autoUpdater.checkForUpdates().catch(() => {});
}
