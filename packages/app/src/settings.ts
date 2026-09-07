import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

import { app } from "electron";

/** Locales offered for number formatting, keyed by the sample the user sees. */
export type NumberFormat = "en-US" | "pt-BR" | "fr-FR";

export interface AppSettings {
  theme?: "auto" | "dark" | "light";
  /** Electron accelerator that shows/hides the window from any app. Empty string disables it. */
  globalShortcut?: string;
  alwaysOnTop?: boolean;
  numberFormat?: NumberFormat;
  /** Maximum decimal places, or "auto" to show as many as the value needs. */
  maxDecimals?: number | "auto";
  useGrouping?: boolean;
}

export const DEFAULT_GLOBAL_SHORTCUT = "CommandOrControl+Alt+Space";

export const DEFAULT_SETTINGS: Required<AppSettings> = {
  theme: "auto",
  globalShortcut: DEFAULT_GLOBAL_SHORTCUT,
  alwaysOnTop: false,
  numberFormat: "en-US",
  maxDecimals: "auto",
  useGrouping: true,
};

/** Settings with defaults filled in, as shown in the UI. */
export function getEffectiveSettings(): Required<AppSettings> {
  return { ...DEFAULT_SETTINGS, ...loadSettings() };
}

function getSettingsPath(): string {
  return join(app.getPath("userData"), "settings.json");
}

export function loadSettings(): AppSettings {
  const path = getSettingsPath();
  try {
    if (existsSync(path)) {
      return JSON.parse(readFileSync(path, "utf-8")) as AppSettings;
    }
  } catch {
    // Corrupted settings — return defaults
  }
  return {};
}

export function saveSettings(settings: AppSettings): void {
  const path = getSettingsPath();
  try {
    const dir = dirname(path);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(path, JSON.stringify(settings, null, 2), "utf-8");
  } catch {
    // Cannot save — ignore
  }
}

export function saveSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
  const settings = loadSettings();
  settings[key] = value;
  saveSettings(settings);
}
