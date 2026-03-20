import { Menu, app, type BrowserWindow } from "electron";

const isMac = process.platform === "darwin";

export function createAppMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" as const },
              { type: "separator" as const },
              { role: "hide" as const },
              { role: "hideOthers" as const },
              { role: "unhide" as const },
              { type: "separator" as const },
              { role: "quit" as const },
            ],
          },
        ]
      : []),
    {
      label: "File",
      submenu: [
        {
          label: "New Note",
          accelerator: "CmdOrCtrl+N",
          click: (_item, win) => {
            (win as BrowserWindow | undefined)?.webContents.send("numi:newNote");
          },
        },
        {
          label: "Close Note",
          accelerator: "CmdOrCtrl+W",
          click: (_item, win) => {
            (win as BrowserWindow | undefined)?.webContents.send("numi:closeNote");
          },
        },
        { type: "separator" },
        ...(isMac ? [] : [{ role: "quit" as const }]),
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        {
          label: "Toggle Theme",
          accelerator: "CmdOrCtrl+Shift+T",
          click: (_item, win) => {
            (win as BrowserWindow | undefined)?.webContents.send("numi:toggleTheme");
          },
        },
        { type: "separator" },
        { role: "reload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Results",
      submenu: [
        {
          label: "Copy Current Result",
          accelerator: "CmdOrCtrl+Shift+C",
          click: (_item, win) => {
            (win as BrowserWindow | undefined)?.webContents.send("numi:copyCurrentResult");
          },
        },
        {
          label: "Copy All Results",
          accelerator: "CmdOrCtrl+Shift+A",
          click: (_item, win) => {
            (win as BrowserWindow | undefined)?.webContents.send("numi:copyAllResults");
          },
        },
      ],
    },
    {
      role: "window",
      submenu: [{ role: "minimize" }, { role: "close" }],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
