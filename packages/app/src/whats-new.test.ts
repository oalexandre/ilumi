import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const state = vi.hoisted(() => ({ userData: "", version: "0.3.0" }));

vi.mock("electron", () => ({
  app: { getPath: () => state.userData, getVersion: () => state.version, isPackaged: false },
}));

vi.mock("../../../changelog.md?raw", () => ({
  default: `# Changelog

## Unreleased

### Added

- Not shipped yet.

## 0.3.0 — 2026-10-01

### Added

- Feature C.

## 0.2.10 — 2026-09-30

### Fixed

- Fix ten.

## 0.2.2 — 2026-09-16

### Added

- Feature B.

## 0.2.1 — 2026-09-16

### Fixed

- Fix one.

## 0.2.0 — 2026-09-07

### Added

- Feature A.
`,
}));

let tmpDir: string;

type WhatsNew = typeof import("./whats-new.js");

/** Fresh module instance, so the `freshInstall` flag starts over like on a real launch. */
async function launch(): Promise<WhatsNew> {
  vi.resetModules();
  const mod = await import("./whats-new.js");
  mod.initWhatsNew();
  return mod;
}

const settingsPath = () => join(state.userData, "settings.json");
const writeSettings = (settings: object) => writeFileSync(settingsPath(), JSON.stringify(settings));
const savedLastSeen = () =>
  (JSON.parse(readFileSync(settingsPath(), "utf-8")) as { lastSeenVersion?: string })
    .lastSeenVersion;
const versionsOf = (entries: { version: string }[] | null) =>
  entries?.map((e) => e.version) ?? null;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "ilumi-whatsnew-"));
  state.userData = tmpDir;
  state.version = "0.3.0";
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe("initWhatsNew / isFreshInstall", () => {
  it("is a fresh install without settings or notes", async () => {
    const mod = await launch();
    expect(mod.isFreshInstall()).toBe(true);
  });

  it("is a fresh install when the notes directory has no JSON files", async () => {
    mkdirSync(join(tmpDir, "notes"));
    writeFileSync(join(tmpDir, "notes", ".DS_Store"), "");
    const mod = await launch();
    expect(mod.isFreshInstall()).toBe(true);
  });

  it("is not a fresh install when settings exist", async () => {
    writeSettings({});
    const mod = await launch();
    expect(mod.isFreshInstall()).toBe(false);
  });

  it("is not a fresh install when notes exist", async () => {
    mkdirSync(join(tmpDir, "notes"));
    writeFileSync(join(tmpDir, "notes", "abc.json"), "{}");
    const mod = await launch();
    expect(mod.isFreshInstall()).toBe(false);
  });
});

describe("getWhatsNew", () => {
  it("shows nothing on a fresh install and records the version", async () => {
    const mod = await launch();
    expect(mod.getWhatsNew()).toBeNull();
    expect(savedLastSeen()).toBe("0.3.0");
  });

  it("shows nothing when the current version was already seen", async () => {
    writeSettings({ lastSeenVersion: "0.3.0", theme: "dark" });
    const mod = await launch();
    expect(mod.getWhatsNew()).toBeNull();
    expect(JSON.parse(readFileSync(settingsPath(), "utf-8"))).toEqual({
      lastSeenVersion: "0.3.0",
      theme: "dark",
    });
  });

  it("shows every skipped version up to the current one, newest first", async () => {
    writeSettings({ lastSeenVersion: "0.2.1" });
    const mod = await launch();
    const entries = mod.getWhatsNew();
    expect(versionsOf(entries)).toEqual(["0.3.0", "0.2.10", "0.2.2"]);
    expect(entries?.[0]?.sections).toEqual([{ title: "Added", items: ["Feature C."] }]);
    // Not recorded until dismissed.
    expect(savedLastSeen()).toBe("0.2.1");
  });

  it("compares versions numerically (0.2.10 is newer than 0.2.2)", async () => {
    writeSettings({ lastSeenVersion: "0.2.2" });
    const mod = await launch();
    expect(versionsOf(mod.getWhatsNew())).toEqual(["0.3.0", "0.2.10"]);
  });

  it("excludes versions newer than the running one and the Unreleased entry", async () => {
    state.version = "0.2.2";
    writeSettings({ lastSeenVersion: "0.2.0" });
    const mod = await launch();
    expect(versionsOf(mod.getWhatsNew())).toEqual(["0.2.2", "0.2.1"]);
  });

  it("falls back to FIRST_TRACKED_VERSION (0.2.0) for users from before the panel", async () => {
    writeSettings({ theme: "light" });
    const mod = await launch();
    expect(versionsOf(mod.getWhatsNew())).toEqual(["0.3.0", "0.2.10", "0.2.2", "0.2.1"]);
  });

  it("falls back to FIRST_TRACKED_VERSION when lastSeenVersion is not semver", async () => {
    writeSettings({ lastSeenVersion: "garbage" });
    const mod = await launch();
    expect(versionsOf(mod.getWhatsNew())).toEqual(["0.3.0", "0.2.10", "0.2.2", "0.2.1"]);
  });

  it("shows nothing and records the version when the running version is not semver", async () => {
    state.version = "0.3.0-beta.1";
    writeSettings({ lastSeenVersion: "0.2.1" });
    const mod = await launch();
    expect(mod.getWhatsNew()).toBeNull();
    expect(savedLastSeen()).toBe("0.3.0-beta.1");
  });

  it("shows nothing and records the version when no changelog entry is unseen", async () => {
    state.version = "0.4.0";
    writeSettings({ lastSeenVersion: "0.3.0" });
    const mod = await launch();
    expect(mod.getWhatsNew()).toBeNull();
    expect(savedLastSeen()).toBe("0.4.0");
  });

  it("shows nothing when downgraded to an older version", async () => {
    state.version = "0.2.1";
    writeSettings({ lastSeenVersion: "0.3.0" });
    const mod = await launch();
    expect(mod.getWhatsNew()).toBeNull();
    expect(savedLastSeen()).toBe("0.2.1");
  });

  it("keeps showing the panel until it is dismissed", async () => {
    writeSettings({ lastSeenVersion: "0.2.2" });
    const mod = await launch();
    expect(versionsOf(mod.getWhatsNew())).toEqual(["0.3.0", "0.2.10"]);
    expect(versionsOf((await launch()).getWhatsNew())).toEqual(["0.3.0", "0.2.10"]);
  });
});

describe("dismissWhatsNew", () => {
  it("persists the current version so the next launch shows nothing", async () => {
    writeSettings({ lastSeenVersion: "0.2.2", theme: "dark" });
    const mod = await launch();
    mod.dismissWhatsNew();
    expect(JSON.parse(readFileSync(settingsPath(), "utf-8"))).toEqual({
      lastSeenVersion: "0.3.0",
      theme: "dark",
    });
    expect((await launch()).getWhatsNew()).toBeNull();
  });
});

describe("getChangelog / getCurrentReleaseNotes", () => {
  it("returns every entry of the bundled changelog, newest first", async () => {
    const mod = await launch();
    expect(versionsOf(mod.getChangelog())).toEqual([
      "Unreleased",
      "0.3.0",
      "0.2.10",
      "0.2.2",
      "0.2.1",
      "0.2.0",
    ]);
  });

  it("returns the notes of the running version", async () => {
    state.version = "0.2.1";
    const mod = await launch();
    expect(mod.getCurrentReleaseNotes()).toEqual([
      { version: "0.2.1", date: "2026-09-16", sections: [{ title: "Fixed", items: ["Fix one."] }] },
    ]);
  });

  it("returns an empty list when the running version has no entry", async () => {
    state.version = "9.9.9";
    const mod = await launch();
    expect(mod.getCurrentReleaseNotes()).toEqual([]);
  });
});
