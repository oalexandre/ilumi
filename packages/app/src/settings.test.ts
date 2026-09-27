import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const state = vi.hoisted(() => ({ userData: "" }));

vi.mock("electron", () => ({
  app: { getPath: () => state.userData, getVersion: () => "1.0.0", isPackaged: false },
}));

import {
  DEFAULT_GLOBAL_SHORTCUT,
  DEFAULT_SETTINGS,
  getEffectiveSettings,
  loadSettings,
  saveSetting,
  saveSettings,
} from "./settings.js";

let tmpDir: string;

const settingsPath = () => join(state.userData, "settings.json");
const readSaved = () => JSON.parse(readFileSync(settingsPath(), "utf-8")) as unknown;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "ilumi-settings-"));
  state.userData = tmpDir;
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe("loadSettings", () => {
  it("returns an empty object when the file is missing", () => {
    expect(loadSettings()).toEqual({});
  });

  it("returns the saved settings", () => {
    writeFileSync(settingsPath(), JSON.stringify({ theme: "dark", maxDecimals: 4 }));
    expect(loadSettings()).toEqual({ theme: "dark", maxDecimals: 4 });
  });

  it("returns an empty object when the file is corrupt", () => {
    writeFileSync(settingsPath(), "{ theme: dark,");
    expect(loadSettings()).toEqual({});
  });

  it("returns an empty object when the file is empty", () => {
    writeFileSync(settingsPath(), "");
    expect(loadSettings()).toEqual({});
  });

  // BUG: a settings.json whose JSON is valid but not an object (`null`, `42`) is returned
  // as-is. saveSetting then throws a TypeError assigning a key on it, and
  // getWhatsNew crashes reading `.lastSeenVersion` of null.
  it("returns an empty object when the file holds valid JSON that is not an object", () => {
    for (const content of ["null", "42", "[1, 2]", '"dark"']) {
      writeFileSync(settingsPath(), content);
      expect(loadSettings()).toEqual({});
    }
  });

  it("can save a setting over a file holding JSON null", () => {
    writeFileSync(settingsPath(), "null");
    saveSetting("theme", "dark");
    expect(loadSettings()).toEqual({ theme: "dark" });
  });
});

describe("saveSettings", () => {
  it("writes pretty-printed JSON", () => {
    saveSettings({ theme: "light" });
    expect(readFileSync(settingsPath(), "utf-8")).toBe('{\n  "theme": "light"\n}');
  });

  it("creates the userData directory when it does not exist", () => {
    state.userData = join(tmpDir, "nested", "userData");
    saveSettings({ alwaysOnTop: true });
    expect(existsSync(settingsPath())).toBe(true);
    expect(readSaved()).toEqual({ alwaysOnTop: true });
  });

  it("does not throw when the file cannot be written", () => {
    // A directory in place of the file makes writeFileSync fail.
    mkdirSync(settingsPath());
    expect(() => saveSettings({ theme: "dark" })).not.toThrow();
  });
});

describe("saveSetting", () => {
  it("merges the key into the existing settings and persists it", () => {
    saveSettings({ theme: "dark", useGrouping: false });
    saveSetting("maxDecimals", 2);
    expect(readSaved()).toEqual({ theme: "dark", useGrouping: false, maxDecimals: 2 });
  });

  it("overwrites an existing key", () => {
    saveSettings({ theme: "dark" });
    saveSetting("theme", "light");
    expect(loadSettings()).toEqual({ theme: "light" });
  });

  it("creates the file when none exists", () => {
    saveSetting("globalShortcut", "");
    expect(readSaved()).toEqual({ globalShortcut: "" });
  });

  it("replaces a corrupt file with just the new key", () => {
    writeFileSync(settingsPath(), "not json");
    saveSetting("numberFormat", "pt-BR");
    expect(readSaved()).toEqual({ numberFormat: "pt-BR" });
  });
});

describe("getEffectiveSettings", () => {
  it("returns the defaults when nothing is saved", () => {
    expect(getEffectiveSettings()).toEqual({
      theme: "auto",
      globalShortcut: DEFAULT_GLOBAL_SHORTCUT,
      alwaysOnTop: false,
      numberFormat: "en-US",
      maxDecimals: "auto",
      useGrouping: true,
      lastSeenVersion: "",
    });
    expect(DEFAULT_GLOBAL_SHORTCUT).toBe("CommandOrControl+Alt+Space");
  });

  it.each([
    ["theme", "dark"],
    ["globalShortcut", ""],
    ["alwaysOnTop", true],
    ["numberFormat", "fr-FR"],
    ["maxDecimals", 0],
    ["useGrouping", false],
    ["lastSeenVersion", "0.2.2"],
  ] as const)("overrides the default of %s with the saved value", (key, value) => {
    saveSetting(key, value);
    expect(getEffectiveSettings()).toEqual({ ...DEFAULT_SETTINGS, [key]: value });
  });

  it("falls back to defaults when the file is corrupt", () => {
    writeFileSync(settingsPath(), "{");
    expect(getEffectiveSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("does not mutate DEFAULT_SETTINGS", () => {
    saveSetting("theme", "light");
    getEffectiveSettings().theme = "dark";
    expect(DEFAULT_SETTINGS.theme).toBe("auto");
  });
});
