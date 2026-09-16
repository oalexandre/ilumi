import { describe, it, expect } from "vitest";

import { compareVersions, parseChangelog, parseReleaseNotes } from "./release-notes.js";

const CHANGELOG = `# Changelog

## Unreleased

### Fixed

- Something not shipped yet.

## 0.2.1 — 2026-09-16

### Fixed

- \`Cmd/Ctrl+=\` now zooms in.
- Complex formulas no longer freeze the app: the parser now memoizes
  intermediate results.

## 0.2.0 — 2026-09-07

### Added

- Global shortcut.

### Changed

- Settings panel shows the real app version.
`;

describe("parseChangelog", () => {
  it("returns every entry in document order with its sections", () => {
    const entries = parseChangelog(CHANGELOG);
    expect(entries.map((e) => e.version)).toEqual(["Unreleased", "0.2.1", "0.2.0"]);
    expect(entries[2]).toEqual({
      version: "0.2.0",
      date: "2026-09-07",
      sections: [
        { title: "Added", items: ["Global shortcut."] },
        { title: "Changed", items: ["Settings panel shows the real app version."] },
      ],
    });
    expect(entries[0]?.date).toBeUndefined();
  });

  it("joins wrapped bullet lines", () => {
    const notes = parseReleaseNotes(CHANGELOG, "0.2.1");
    expect(notes?.sections[0]?.items[1]).toBe(
      "Complex formulas no longer freeze the app: the parser now memoizes intermediate results.",
    );
  });

  it("returns null for an unknown version", () => {
    expect(parseReleaseNotes(CHANGELOG, "9.9.9")).toBeNull();
  });

  it("drops entries without items", () => {
    expect(parseChangelog("## 1.0.0\n\n### Added\n\n## 0.9.0\n\n- x\n").map((e) => e.version)).toEqual([
      "0.9.0",
    ]);
  });
});

describe("compareVersions", () => {
  it("orders numerically, not lexically", () => {
    expect(compareVersions("0.2.2", "0.2.10")).toBeLessThan(0);
    expect(compareVersions("1.0.0", "0.9.9")).toBeGreaterThan(0);
    expect(compareVersions("0.2.1", "0.2.1")).toBe(0);
  });
});
