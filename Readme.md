# Ilumi

**[ilumi.oalexandre.com.br](https://ilumi.oalexandre.com.br)**

Ilumi is a notepad-style calculator app for macOS, Windows and Linux. It allows you to describe tasks naturally and instantly get an answer. For example, `$20 in euro - 5% discount` or `today + 2 weeks`.

## Features

- **Natural expressions** — type math as you think: `price = 100`, `price + 8% tax`
- **Variables** — assign and reuse values across lines
- **Unit conversions** — `5 km to miles`, `100 celsius to fahrenheit`, `32 px to rem`
- **Percentages** — `100 + 5%`, `10% off 50`, `5% of 200`
- **Math functions** — `sqrt(16)`, `sin(pi/2)`, `log(100)`, `min(3,1,2)`
- **Currency conversion** — `$20 in EUR` with live exchange rates
- **Date arithmetic** — `today + 2 weeks`, duration conversions
- **Base conversion** — `255 in hex`, `0xFF in binary`
- **Bitwise operations** — `AND`, `OR`, `XOR`, `NOT`, `<<`, `>>`
- **Line references** — `sum`, `avg`, `prev`, `count`
- **Multiple notes** — tabbed interface with auto-save
- **Plugin system** — extend with custom units and functions ([guide](docs/plugins.md))
- **Dark & light themes** — follows system preference or manual toggle
- **Timezone conversion** — `now in UTC`, `today in Tokyo`, 400+ IANA zones
- **Syntax highlighting** — numbers, variables, functions, units, comments
- **Share as image** — copy branded PNG card to clipboard

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) >= 9

### Setup

```bash
git clone <repo-url>
cd ilumi
pnpm install
```

### Running in dev mode

```bash
pnpm dev
```

This starts Electron with hot-reload enabled — changes to the renderer (React) are reflected instantly, and changes to the main process trigger an automatic restart.

### Running tests

```bash
# Run all tests once
pnpm test

# Run tests in watch mode (re-runs on file changes)
pnpm test:watch

# Run E2E tests (builds first, then launches Electron)
pnpm test:e2e
```

### Other useful commands

```bash
# Type-check all packages
pnpm typecheck

# Lint
pnpm lint

# Auto-fix lint issues
pnpm lint:fix

# Format code with Prettier
pnpm format

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Packaging for distribution

Build distributable installers using [electron-builder](https://www.electron.build/):

```bash
# Build for current platform
pnpm dist

# Platform-specific builds
pnpm dist:mac      # DMG (arm64 + x64)
pnpm dist:win      # NSIS installer (x64)
pnpm dist:linux    # AppImage + .deb (x64)
```

Output goes to `dist/`. Configuration is in `electron-builder.yml`.

### Project structure

```
packages/
  engine/     # Parser, evaluator, units, plugins (pure TS, zero Electron deps)
  app/        # Electron main process + preload
  renderer/   # React UI (CodeMirror 6 + results pane)
plugins/      # Community plugins (Numi-compatible)
resources/    # Platform icons (icns, ico, png, tray icons)
```

## Tech Stack

| Layer    | Technology                       |
| -------- | -------------------------------- |
| Shell    | Electron                         |
| UI       | React + TypeScript               |
| Editor   | CodeMirror 6                     |
| State    | Zustand                          |
| Styling  | Tailwind CSS 4                   |
| Parser   | Peggy (PEG)                      |
| Build    | electron-vite + electron-builder |
| Tests    | Vitest + Playwright              |
| Monorepo | pnpm workspaces                  |

## License

See [LICENSE](license.txt).

---

_Ilumi is inspired by [Numi](https://numi.app) and is compatible with Numi community plugins._
