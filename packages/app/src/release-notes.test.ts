import { describe, it, expect } from "vitest";

import { parseReleaseNotes } from "./release-notes.js";

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

describe("parseReleaseNotes", () => {
  it("returns the sections and items of the requested version only", () => {
    const notes = parseReleaseNotes(CHANGELOG, "0.2.0");
    expect(notes).toEqual({
      version: "0.2.0",
      date: "2026-09-07",
      sections: [
        { title: "Added", items: ["Global shortcut."] },
        { title: "Changed", items: ["Settings panel shows the real app version."] },
      ],
    });
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

  it("returns null when the entry has no items", () => {
    expect(parseReleaseNotes("## 1.0.0\n\n### Added\n\n## 0.9.0\n\n- x\n", "1.0.0")).toBeNull();
  });
});
