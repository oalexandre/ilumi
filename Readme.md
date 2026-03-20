# Numi

[Numi](https://numi.app) is a handy calculator app for macOS. It allows you to describe tasks naturally and instantly get an answer. For example, `$20 in euro - 5% discount` or `today + 2 weeks`.

![](https://numi.app/images/numi-screenshot-yellow.png)

## Installation

Desktop version for macOS can be downloaded from the [app website](https://numi.app) or from releases page on GitHub.

- [Numi for MacOS](https://cdn.numi.app/mac-v3/Numi.dmg)
- [Numi for Windows](https://cdn.numi.app/electron/latest/numi-setup.exe)

Terminal version can be installed using provided shell command (same command used to update binary).

```
curl -sSL https://s.numi.app/cli | sh
```

Alternative way of installing using [Homebrew](https://brew.sh/): `brew install nikolaeu/numi/numi-cli`.

Alfred extension can be [downloaded](https://cdn.numi.app/extensions/numi.alfredworkflow) directly, requires terminal version to work.

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) >= 9

### Setup

```bash
git clone <repo-url>
cd numi
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

### Project structure

```
packages/
  engine/     # Parser, evaluator, units, plugins (pure TS, zero Electron deps)
  app/        # Electron main process + preload
  renderer/   # React UI (CodeMirror 6 + results pane)
plugins/      # Community plugins (Numi-compatible)
```

## Usage

Terminal version can be used this way:

`numi-cli "20 inches in cm"`

Most features of the Numi for macOS are supported in terminal. However, these are the features that **have not yet been implemented**:

- ~Localization support~
- ~Tokens (sum, prev, avg)~
- ~Dates~
- Timezone conversion
- CSS
- Variables
- Plugins/extension
