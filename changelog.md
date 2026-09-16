# Changelog

All notable changes to Ilumi are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/) and the project uses
[Semantic Versioning](https://semver.org/).

This file is shown inside the app ("What's new" panel), so every release needs
a `## X.Y.Z — YYYY-MM-DD` section with `### Added` / `### Changed` / `### Fixed`
bullets. Once the interface is translated, the same section must be written in
`changelog.pt-BR.md` as well: the panel loads the file for the chosen language
and falls back to this one. Keep both files in sync on every release.

## 0.2.2 — 2026-09-16

### Added

- "What's new" panel: the first launch after an update shows the release notes of every version you skipped, grouped by version. It can be reopened from the Help panel ("What's new in this version") and has a link to the full changelog.
- Welcome note on first install: a guided tour with sums, variables, percentages, unit conversions, dates, number bases and functions. Every line evaluates, so the first screen is a working example.

### Fixed

- Currency conversion works in the app (`100 usd in brl`). The engine already had the plugin and the rate fetcher, but the app never registered them. Rates are cached in the user data folder, refreshed hourly and fall back to built-in values offline.
- When a currency result was computed with offline rates (the built-in table, or a cache older than a day), the line shows an "offline" icon and hovering it explains that the result may be inaccurate. Results refresh automatically when live rates arrive.
- A line with leading or trailing spaces (`1 + 1 `) no longer reports a syntax error.
- Arithmetic with units: `2 hours + 30 minutes in minutes` now converts the whole sum (150 min) instead of only the last term. Adding or subtracting compatible units converts to the left operand's unit (`1 km + 500 m` = 1.5 km), scaling by a plain number keeps the unit (`2 hours * 2` = 4 hours), and mixing incompatible units is an error instead of a silent number.
- Dividing a quantity by a number (`10 km / 2`) was a syntax error because the unit name swallowed the slash.
- A variable named like a line-reference keyword (`total`, `sum`, `avg`, …) now shadows the keyword, so `total = rent + food` followed by `20% of total` uses the variable.
- Light theme now has a real colour scheme. The editor follows the app theme (it was stuck on the dark one, leaving near-white text on a white background) and the palette is Catppuccin Latte, the light counterpart of the dark Mocha palette.
- Function names (`sqrt`, `round`, …) are highlighted again in both themes.

## 0.2.1 — 2026-09-16

### Fixed

- `Cmd/Ctrl+=` and `Cmd/Ctrl++` now zoom in (only `Cmd/Ctrl+Shift+=` worked before; zoom out already worked with `Cmd/Ctrl+-`).
- Complex formulas with nested parentheses no longer freeze the app: the parser now memoizes intermediate results (packrat cache), turning exponential backtracking into linear time.

## 0.2.0 — 2026-09-07

### Added

- Global keyboard shortcut (default `Cmd/Ctrl+Alt+Space`) to show or hide the window from any app, configurable in Settings.
- "Always on top" option to keep the window floating above other apps.
- Number format settings: thousands/decimal separators (`1,234.56`, `1.234,56`, `1 234,56`), maximum decimal places and thousands grouping.
- Settings button in the bottom-right corner of the window.
- Autocomplete now suggests variables defined earlier in the document.
- `ILUMI_USER_DATA` environment variable to run the app against an isolated data directory (used by the e2e tests).
- Roadmap document with suggested future features (`docs/roadmap.md`).

### Changed

- While a line is being typed, an error on that line is shown as a pulsing "…" instead of "Syntax error".
- Pressing Enter on a line with a syntax error reveals the error and keeps the cursor on the line. A second Enter creates the new line anyway. Evaluation errors (division by zero, undefined variable) are shown but do not block.
- Leaving a line with the arrow keys, the mouse or by losing focus reveals its error.
- `LineResult` now carries an `errorKind` (`syntax` or `eval`).
- Settings panel shows the real app version.

## 0.1.3 — 2026-03-29

### Fixed

- Auto-updater now works: release artifacts are published with the update metadata.

## 0.1.2 — 2026-03-28

### Changed

- PEG grammar is pre-compiled at build time and the bundle is minified, for faster startup.

### Fixed

- Auto-updater packaging.

## 0.1.1 — 2026-03-22

### Added

- Landing page at [ilumi.oalexandre.com.br](https://ilumi.oalexandre.com.br) with download links for macOS, Windows and Linux (x64 and ARM).
- Note about the macOS Gatekeeper workaround on the download page.

### Fixed

- ESM/CJS interop error when loading `electron-updater`.

## 0.1.0 — 2026-03-21

First public release.

### Added

- Notepad-style calculator with natural expressions, variables and line references (`sum`, `avg`, `prev`, `count`).
- Unit conversions (length, weight, volume, area, temperature, data, CSS units, duration) and currency conversion with live rates.
- Percentages, math functions and constants, base conversion (hex, binary, octal) and bitwise operators.
- Date arithmetic and timezone conversion with the full IANA database.
- Syntax highlighting and context-aware autocomplete (`Ctrl+Space` for the full catalog).
- Multiple notes with tabs and auto-save.
- Plugin system compatible with Numi community plugins, with plugin self-tests and a dynamic help panel.
- Dark and light themes following the system preference, with manual toggle.
- Share the current note as a branded PNG card.
- System tray icon, close-to-tray behaviour and auto-update via `electron-updater`.
- Installers for macOS (DMG), Windows (NSIS) and Linux (AppImage, deb).
