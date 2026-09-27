import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("electron", () => ({
  app: { getPath: () => "", getVersion: () => "0.2.3", isPackaged: false },
  dialog: { showMessageBox: vi.fn() },
  shell: { openExternal: vi.fn() },
}));

vi.mock("electron-updater", () => ({
  default: { autoUpdater: { on: vi.fn(), checkForUpdates: vi.fn(() => Promise.resolve()) } },
}));

import { downloadUrlFor } from "./updater.js";

const RELEASES = "https://github.com/oalexandre/ilumi/releases";

/** The files electron-builder publishes for a macOS release (see electron-builder.yml). */
const MAC_FILES = [
  { url: "Ilumi-0.2.3-arm64-mac.zip" },
  { url: "Ilumi-0.2.3-arm64.dmg" },
  { url: "Ilumi-0.2.3-mac.zip" },
  { url: "Ilumi-0.2.3-x64.dmg" },
];

const originalArch = process.arch;

function setArch(arch: string): void {
  Object.defineProperty(process, "arch", { value: arch, configurable: true });
}

afterEach(() => {
  setArch(originalArch);
});

describe("downloadUrlFor", () => {
  it("links the arm64 DMG on Apple Silicon", () => {
    setArch("arm64");
    expect(downloadUrlFor("0.2.3", MAC_FILES)).toBe(
      `${RELEASES}/download/v0.2.3/Ilumi-0.2.3-arm64.dmg`,
    );
  });

  it("links the x64 DMG on Intel", () => {
    setArch("x64");
    expect(downloadUrlFor("0.2.3", MAC_FILES)).toBe(
      `${RELEASES}/download/v0.2.3/Ilumi-0.2.3-x64.dmg`,
    );
  });

  it("treats any other architecture as x64", () => {
    setArch("ia32");
    expect(downloadUrlFor("0.2.3", MAC_FILES)).toBe(
      `${RELEASES}/download/v0.2.3/Ilumi-0.2.3-x64.dmg`,
    );
  });

  it("uses the version passed in for the tag, not the file name", () => {
    setArch("arm64");
    expect(downloadUrlFor("1.0.0", [{ url: "Ilumi-1.0.0-arm64.dmg" }])).toBe(
      `${RELEASES}/download/v1.0.0/Ilumi-1.0.0-arm64.dmg`,
    );
  });

  it("falls back to the latest release page when no DMG matches the architecture", () => {
    setArch("arm64");
    expect(
      downloadUrlFor("0.2.3", [
        { url: "Ilumi-0.2.3-x64.dmg" },
        { url: "Ilumi-0.2.3-arm64-mac.zip" },
      ]),
    ).toBe(`${RELEASES}/latest`);
  });

  it("falls back to the latest release page when the release lists no files", () => {
    setArch("x64");
    expect(downloadUrlFor("0.2.3", [])).toBe(`${RELEASES}/latest`);
  });
});
