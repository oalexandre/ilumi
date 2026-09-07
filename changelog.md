# Changelog

All notable changes to Ilumi are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/) and the project uses
[Semantic Versioning](https://semver.org/).

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
