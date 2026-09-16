import { app, dialog, shell, type BrowserWindow } from "electron";
import pkg from "electron-updater";
const { autoUpdater } = pkg;

const UPDATE_CHECK_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours

const RELEASES_URL = "https://github.com/oalexandre/ilumi/releases";

/**
 * Squirrel.Mac, which installs updates on macOS, refuses bundles that are not
 * signed with a Developer ID. The app is only ad-hoc signed, so on macOS we do
 * not download or install anything: we point the user at the DMG instead.
 */
const MANUAL_INSTALL = process.platform === "darwin";

/** Versions the user already declined this session, so they are not nagged every check. */
const dismissed = new Set<string>();

/** Direct link to the DMG for this machine, or the releases page when the file is unknown. */
function downloadUrlFor(version: string, files: Array<{ url: string }>): string {
  const arch = process.arch === "arm64" ? "arm64" : "x64";
  const dmg = files.find((f) => f.url.endsWith(`-${arch}.dmg`));
  return dmg ? `${RELEASES_URL}/download/v${version}/${dmg.url}` : `${RELEASES_URL}/latest`;
}

export function setupAutoUpdater(getWindow: () => BrowserWindow | null): void {
  // Don't check for updates in dev mode
  if (!app.isPackaged) return;

  autoUpdater.autoDownload = !MANUAL_INSTALL;
  autoUpdater.autoInstallOnAppQuit = !MANUAL_INSTALL;

  autoUpdater.on("update-available", (info) => {
    const win = getWindow();
    win?.webContents.send("numi:updateAvailable", info.version);

    if (!MANUAL_INSTALL || !win || dismissed.has(info.version)) return;

    dialog
      .showMessageBox(win, {
        type: "info",
        title: "Update Available",
        message: `Ilumi ${info.version} is available.`,
        detail:
          "Automatic installation is not available on macOS yet. " +
          "Download the new version, then drag it to the Applications folder to replace this one.",
        buttons: ["Download", "Later"],
        defaultId: 0,
        cancelId: 1,
      })
      .then(({ response }) => {
        if (response !== 0) {
          dismissed.add(info.version);
          return;
        }
        void shell.openExternal(downloadUrlFor(info.version, info.files));
        // Quit so the replaced bundle is not in use when the user drags the new one over it.
        app.isQuitting = true;
        app.quit();
      });
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
