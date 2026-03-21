# Ilumi Plugin System

Ilumi supports two types of plugins: **Core Plugins** (TypeScript, built-in) and **Community Plugins** (JavaScript, user-installable). Both use the same entity registration system — their entities automatically appear in the parser, evaluator, autocomplete, and syntax highlighting.

Website: [ilumi.oalexandre.com.br](https://ilumi.oalexandre.com.br)

> **Numi compatibility:** Ilumi is fully compatible with [Numi](https://numi.app) community plugins. Any `.js` plugin written for Numi works in Ilumi without modification — just copy it to the plugins directory.

---

## Table of Contents

1. [Getting Started — Community Plugins](#getting-started--community-plugins)
2. [Installing Plugins](#installing-plugins)
3. [Community Plugin API](#community-plugin-api)
   - [numi.addFunction()](#numiaddfunctiondefinition-callback)
   - [numi.addUnit()](#numiaddunitdefinition)
   - [numi.addTest()](#numiaddtesttest)
   - [numi.addHelp()](#numiaddhelpsection)
4. [Core Plugins (TypeScript)](#core-plugins-typescript)
5. [Entity Types Reference](#entity-types-reference)
6. [PluginManifest Interface](#pluginmanifest-interface)
7. [Sandbox & Limitations](#sandbox--limitations)
8. [Hot-Reload](#hot-reload)
9. [Error Handling](#error-handling)
10. [Directory Structure](#directory-structure)

---

## Getting Started — Community Plugins

A community plugin is a single `.js` file that uses the `numi` API to register functions, units, and tests. Here's a complete example:

```javascript
// MyPlugin.js — converts dog years to human years

numi.addUnit({
  id: "dogyear",
  phrases: "dog years, dog year, dogyears",
  baseUnitId: "humanyear",
  format: "dog years",
  ratio: 7,
});

numi.addUnit({
  id: "humanyear",
  phrases: "human years, human year",
  baseUnitId: "humanyear",
  format: "human years",
  ratio: 1,
});

numi.addTest({
  description: "3 dog years = 21 human years",
  input: "3 dog years to human years",
  expected: 21,
});
```

After saving this file, Ilumi will pick it up automatically — type `3 dog years to human years` and get `21 human years`.

---

## Installing Plugins

Place your `.js` file (or a folder containing one `.js` file) in the plugins directory:

| Platform | Path |
|----------|------|
| **macOS / Linux** | `~/.ilumi-calc/plugins/` |
| **Windows** | `%USERPROFILE%\.ilumi-calc\plugins\` |

Ilumi creates this directory automatically on first launch. You can also place plugins inside a subdirectory:

```
~/.ilumi-calc/plugins/
├── MyPlugin.js                   # single-file plugin
└── SpeedUnits/                   # directory plugin
    └── SpeedUnits.js
```

> **Note:** for directory plugins, Ilumi loads the first `.js` file found. Use one `.js` file per directory.

Bundled community plugins ship in `plugins/CommunityPlugins/` inside the app.

---

## Community Plugin API

Community plugins have access to three methods on the global `numi` object.

### `numi.addFunction(definition, callback)`

Registers a custom function that users can call in expressions.

**Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| `definition.id` | `string` | Unique identifier |
| `definition.phrases` | `string` | Comma-separated names the user can type |
| `callback` | `function` | Receives `values` array, returns `{ double }` |

The `callback` receives an array of value objects:

```javascript
// Each value in the array:
{
  double: 42,        // the numeric value
  unitId: "meter"    // the unit (if any), or undefined
}
```

The callback must return `{ double: number }` or `{ double: number, unitId: string }`.

**Example — single argument:**

```javascript
// Usage: factorial(5) → 120
// Usage: fact(5) → 120  (alias)

numi.addFunction(
  { id: "factorial", phrases: "factorial, fact" },
  function (values) {
    var n = values[0].double;
    var result = 1;
    for (var i = 2; i <= n; i++) result *= i;
    return { double: result };
  }
);
```

**Example — multiple arguments:**

```javascript
// Usage: clamp(15, 0, 10) → 10

numi.addFunction(
  { id: "clamp", phrases: "clamp" },
  function (values) {
    var x = values[0].double;
    var min = values[1].double;
    var max = values[2].double;
    return { double: Math.min(Math.max(x, min), max) };
  }
);
```

**Example — returning a unit:**

```javascript
// Usage: change(100, 150) → 50%

numi.addFunction(
  { id: "change", phrases: "change, percentchange" },
  function (values) {
    var initial = values[0].double;
    var final = values[1].double;
    return {
      double: ((final - initial) / initial) * 100,
      unitId: "percent",
    };
  }
);
```

**Example — variadic (any number of arguments):**

```javascript
// Usage: stddev(10, 20, 30) → 8.165

numi.addFunction(
  { id: "stddev", phrases: "stddev, stdev, sd" },
  function (values) {
    var nums = values.map(function (v) { return v.double; });
    var mean = nums.reduce(function (a, b) { return a + b; }, 0) / nums.length;
    var variance = nums.reduce(function (a, x) {
      return a + (x - mean) * (x - mean);
    }, 0) / nums.length;
    return { double: Math.sqrt(variance) };
  }
);
```

---

### `numi.addUnit(definition)`

Registers a unit that participates in conversions via `in`, `to`, or `as` keywords.

**Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier |
| `phrases` | `string` | Comma-separated names the user can type |
| `baseUnitId` | `string` | The base unit this converts to — units with the same `baseUnitId` are convertible |
| `format` | `string` | How the result is displayed (e.g., `"km/h"`, `"°F"`) |
| `ratio` | `number` | How many base units equal 1 of this unit |
| `toBase` | `function` | *(optional)* Custom conversion to base unit (for non-linear conversions) |
| `fromBase` | `function` | *(optional)* Custom conversion from base unit (for non-linear conversions) |

**How `ratio` works:** If the base unit is `meter` and `ratio` is `0.3048`, it means `1 foot = 0.3048 meters`. The formula is: `value_in_base = value * ratio`.

**Example — linear conversions (ratio):**

```javascript
// Usage: 100 kmh to mph → 62.14 mph
// All units share baseUnitId "speed_base", making them convertible

numi.addUnit({
  id: "kmh",
  phrases: "kmh, kmph, kilometers per hour",
  baseUnitId: "speed_base",
  format: "km/h",
  ratio: 1,
});

numi.addUnit({
  id: "mph",
  phrases: "mph, miles per hour",
  baseUnitId: "speed_base",
  format: "mph",
  ratio: 1.609344,
});

numi.addUnit({
  id: "knots",
  phrases: "kts, knots",
  baseUnitId: "speed_base",
  format: "kt",
  ratio: 1.852,
});
```

**Example — non-linear conversions (toBase/fromBase):**

For units that don't convert with a simple ratio (like temperature), use `toBase` and `fromBase`:

```javascript
// Usage: 100 celsius to fahrenheit → 212 °F

numi.addUnit({
  id: "celsius",
  phrases: "celsius, °C, degC",
  baseUnitId: "temperature",
  format: "°C",
  ratio: 1,
});

numi.addUnit({
  id: "fahrenheit",
  phrases: "fahrenheit, °F, degF",
  baseUnitId: "temperature",
  format: "°F",
  ratio: 1,
  toBase: function (f) { return (f - 32) * (5 / 9); },
  fromBase: function (c) { return c * (9 / 5) + 32; },
});
```

> When `toBase`/`fromBase` are provided, `ratio` is ignored. `toBase(value)` converts to the base unit, `fromBase(baseValue)` converts back.

**Example — data rate units:**

```javascript
numi.addUnit({ id: "bps",  phrases: "bps, bits per second",     baseUnitId: "bps", format: "bps",  ratio: 1 });
numi.addUnit({ id: "kbps", phrases: "kbps, kilobits per second", baseUnitId: "bps", format: "Kbps", ratio: 1000 });
numi.addUnit({ id: "mbps", phrases: "mbps, megabits per second", baseUnitId: "bps", format: "Mbps", ratio: 1000000 });
numi.addUnit({ id: "gbps", phrases: "gbps, gigabits per second", baseUnitId: "bps", format: "Gbps", ratio: 1000000000 });
```

---

### `numi.addTest(test)`

Registers a test case that validates the plugin works correctly. Tests are run by the Ilumi test suite.

**Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| `description` | `string` | What the test verifies |
| `input` | `string` | Expression to evaluate (may contain `\n` for multiple lines) |
| `expected` | `number \| null` | *(optional)* Expected numeric result (`null` = no result expected) |
| `formatted` | `string` | *(optional)* Expected formatted output string |
| `line` | `number` | *(optional)* Which result line to check (default: `0`; negative counts from end) |
| `tolerance` | `number` | *(optional)* Tolerance for approximate comparisons (default: exact match) |

**Example — basic test:**

```javascript
numi.addTest({
  description: "100 kmh ≈ 62.14 mph",
  input: "100 kmh to mph",
  expected: 62.137,
  tolerance: 0.1,
});
```

**Example — exact match:**

```javascript
numi.addTest({
  description: "1 kW = 1000 W",
  input: "1 kW to W",
  expected: 1000,
});
```

**Example — check formatted output:**

```javascript
numi.addTest({
  description: "displays with unit suffix",
  input: "255 in hex",
  formatted: "0xFF",
});
```

**Example — multi-line test:**

```javascript
numi.addTest({
  description: "variables work across lines",
  input: "x = 10\nx * 2",
  line: 1,         // check the second line (0-indexed)
  expected: 20,
});
```

> **Best practice:** always add tests for your plugins. They serve as documentation and catch regressions.

---

### `numi.addHelp(section)`

Registers a help section that appears in the app's Help panel. This makes your plugin discoverable to users.

**Parameters:**

| Field | Type | Description |
|-------|------|-------------|
| `title` | `string` | Section title (e.g., "Speed Units") |
| `description` | `string` | *(optional)* Brief description shown below the title |
| `examples` | `array` | List of `{ input, output, desc? }` usage examples |

**Example:**

```javascript
numi.addHelp({
  title: "Speed",
  description: "Convert between speed units.",
  examples: [
    { input: "100 kmh to mph", output: "62.14 mph" },
    { input: "1 mps to kmh", output: "3.6 km/h" },
    { input: "60 mph to knots", output: "52.14 kt" },
  ],
});
```

Help sections from community plugins appear in the Help panel below core plugin sections, under a "Community Plugins" label.

> **Best practice:** always add a help section so users know your plugin exists and how to use it.

---

## Core Plugins (TypeScript)

Core plugins are built-in and use the full `PluginManifest` interface. They have access to all entity types, including ones not available to community plugins.

### Capabilities comparison

| Entity type | Community Plugin | Core Plugin |
|-------------|:---:|:---:|
| Functions | `numi.addFunction()` | `functions` |
| Units | `numi.addUnit()` | `units` |
| Tests | `numi.addTest()` | `tests` |
| Help | `numi.addHelp()` | `help` |
| Constants | — | `constants` |
| Line References | — | `lineRefs` |
| Date Literals | — | `dateLiterals` |
| Base Conversions | — | `baseConversions` |

### Creating a core plugin

1. Create a directory under `packages/engine/src/core-plugins/`
2. Export a `PluginManifest` from `index.ts`
3. Add it to the `corePlugins` array in `core-plugins/index.ts`
4. All entities in the manifest automatically appear in parser, evaluator, autocomplete, and syntax highlighting

```typescript
import type { PluginManifest } from "../types.js";

export const myPlugin: PluginManifest = {
  id: "core.my-plugin",
  name: "My Plugin",
  description: "Does something useful",
  // Add any entity types below...
};
```

---

## Entity Types Reference

### Functions

Math functions that take one or more numeric arguments.

```typescript
// Core plugin
functions: {
  sqrt: { fn: Math.sqrt, detail: "square root" },
  clamp: {
    fn: (x, min, max) => Math.min(Math.max(x, min), max),
    detail: "clamp value to range",
  },
}
```

```javascript
// Community plugin
numi.addFunction(
  { id: "factorial", phrases: "factorial, fact" },
  function (values) {
    var n = values[0].double;
    var result = 1;
    for (var i = 2; i <= n; i++) result *= i;
    return { double: result };
  }
);
```

> **Note:** core plugin functions receive raw numbers (`(...args: number[]) => number`). Community plugin callbacks use the Numi-compatible format: they receive `values` objects (`[{ double, unitId? }]`) and return `{ double, unitId? }`. This ensures full compatibility with existing Numi plugins. Ilumi handles the conversion between formats automatically.

### Constants

Named numeric values. **Core plugins only.**

```typescript
constants: {
  phi: { value: 1.618033988749895, detail: "golden ratio" },
  tau: { value: Math.PI * 2, detail: "2π" },
}
```

Usage: `phi * 10` → `16.18`

### Units

Physical or abstract units with conversion ratios. See the [numi.addUnit()](#numiaddunitdefinition) section for full details and examples.

```typescript
// Core plugin
units: [
  { id: "meter", phrases: "meter, meters, m", baseUnitId: "meter", format: "m", ratio: 1 },
  { id: "foot",  phrases: "foot, feet, ft",   baseUnitId: "meter", format: "ft", ratio: 0.3048 },
]
```

Usage: `5 feet to meters` → `1.524 m`

### Line References

Aggregate functions that reference previous line results. **Core plugins only.**

```typescript
lineRefs: {
  median: {
    handler: (ctx) => {
      const vals = ctx.previousResults
        .slice(0, ctx.currentLine)
        .filter((v): v is number => v !== null)
        .sort((a, b) => a - b);
      if (vals.length === 0) return 0;
      const mid = Math.floor(vals.length / 2);
      return vals.length % 2 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2;
    },
    detail: "median of lines above",
  },
}
```

The handler receives a `LineRefContext`:

```typescript
interface LineRefContext {
  previousResults: (number | null)[];  // results of all lines (null = no value)
  currentLine: number;                  // 0-based index of the current line
}
```

Built-in line references: `sum`, `avg`, `prev`, `count`, `total`

Usage:
```
10
20
30
median   → 20
```

### Date Literals

Keywords that resolve to a `Date` object. **Core plugins only.**

```typescript
dateLiterals: {
  "next-monday": {
    resolver: () => {
      const d = new Date();
      d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7));
      return d;
    },
    detail: "next Monday's date",
  },
}
```

Built-in date literals: `today`, `now`, `tomorrow`, `yesterday`

Usage: `today + 2 weeks` → `Sat, Apr 04, 2026`

### Base Conversions

Number formatting into different bases, used with `in` or `to` keywords. **Core plugins only.**

```typescript
baseConversions: {
  hex: {
    formatter: (n) => "0x" + Math.trunc(n).toString(16).toUpperCase(),
    detail: "hexadecimal",
    aliases: ["hexadecimal"],
    category: "numeric",  // only appears in autocomplete for numeric contexts
  },
}
```

The optional `category` field controls when the conversion appears in autocomplete:

| Category | Shown when |
|----------|-----------|
| `"numeric"` | Source is a plain number (`255 in ...`) |
| `"date"` | Source is a date literal (`now in ...`, `today in ...`) |
| *(omitted)* | Shown in all non-unit contexts (universal) |

When the source is a known unit (e.g., `5 km in ...`), only compatible units are shown — categories are ignored.

Built-in conversions: `hex`, `binary`/`bin`, `octal`/`oct`, `decimal`/`dec` (category: `"numeric"`)

Usage: `255 in hex` → `0xFF`

### Timezone Conversions

Convert date values to different timezones using `in` or `to`. Implemented as base conversions internally.

```
now in UTC      → Fri, Mar 21, 2026, 10:00 PM UTC
today in JST    → Sat, Mar 22, 2026, 7:00 AM JST
tomorrow in BRT → Sun, Mar 22, 2026, 7:00 PM BRT
now in London   → Fri, Mar 21, 2026, 10:00 PM GMT
```

**Supported timezones:**

| Abbreviations | Region |
|---------------|--------|
| `UTC`, `GMT` | Universal / Greenwich |
| `EST`, `EDT`, `CST`, `CDT`, `MST`, `MDT`, `PST`, `PDT` | US timezones |
| `BRT` | Brazil (São Paulo) |
| `CET`, `CEST`, `EET`, `EEST`, `WET`, `MSK` | Europe |
| `JST`, `KST`, `IST`, `SGT`, `HKT` | Asia |
| `AEST`, `AEDT`, `NZST` | Oceania |

**City names:** `London`, `Paris`, `Berlin`, `Moscow`, `Dubai`, `Mumbai`, `Shanghai`, `Tokyo`, `Seoul`, `Singapore`, `Sydney`, `Auckland`, `Lisbon`, `Chicago`, `Denver`

### Tests

Self-validation test cases. Available to both core and community plugins.

```typescript
// Core plugin
tests: [
  { description: "sqrt(16) = 4", input: "sqrt(16)", expected: 4 },
  { description: "sqrt(2) ≈ 1.414", input: "sqrt(2)", expected: 1.41421, tolerance: 0.001 },
]
```

```javascript
// Community plugin
numi.addTest({
  description: "100 kmh ≈ 62.14 mph",
  input: "100 kmh to mph",
  expected: 62.137,
  tolerance: 0.1,
});
```

---

## PluginManifest Interface

```typescript
interface PluginManifest {
  id: string;                    // Unique identifier (e.g., "core.math-functions")
  name: string;                  // Human-readable name
  description?: string;          // Brief description

  functions?: Record<string, { fn: MathFn; detail?: string }>;
  constants?: Record<string, { value: number; detail?: string }>;
  units?: UnitDefinition[];
  lineRefs?: Record<string, { handler: LineRefHandler; detail?: string }>;
  dateLiterals?: Record<string, { resolver: () => Date; detail?: string }>;
  baseConversions?: Record<string, {
    formatter: (n: number) => string;
    detail?: string;
    aliases?: string[];
    category?: string;  // autocomplete context: "date", "numeric", or omit for universal
  }>;
  tests?: PluginTest[];
  help?: HelpSection[];
}

type MathFn = (...args: number[]) => number;

type LineRefHandler = (ctx: LineRefContext) => number;

interface LineRefContext {
  previousResults: (number | null)[];
  currentLine: number;
}

interface PluginTest {
  description: string;
  input: string;
  line?: number;
  expected?: number | null;
  formatted?: string;
  tolerance?: number;
}

interface HelpSection {
  title: string;
  description?: string;
  examples: HelpExample[];
}

interface HelpExample {
  input: string;
  output: string;
  desc?: string;
}

interface UnitDefinition {
  id: string;
  phrases: string;
  baseUnitId: string;
  format: string;
  ratio: number;
  toBase?: (value: number) => number;
  fromBase?: (value: number) => number;
}
```

---

## Sandbox & Limitations

Community plugins run in a [Node.js VM sandbox](https://nodejs.org/api/vm.html) with restricted globals:

| Available | Not available |
|-----------|---------------|
| `Math` | `require` / `import` |
| `JSON` | `fetch` / HTTP |
| `Number`, `String`, `Array`, `Object` | `process`, `Buffer` |
| `parseFloat`, `parseInt` | File system (`fs`) |
| `isNaN`, `isFinite` | `setTimeout`, `setInterval` |
| `console` (no-op) | DOM / `window` |

**Timeout:** plugins that take longer than **5 seconds** to load are terminated.

**Entity restrictions:** community plugins can only register functions, units, and tests. Constants, line references, date literals, and base conversions require core plugins.

---

## Hot-Reload

Ilumi reloads plugins when the app window receives focus. New `.js` files added to the plugins directory are loaded automatically — no restart needed.

**Behavior:**
- Files that were already loaded are **not reloaded** (changes to existing plugin files require restarting the app)
- New files are detected and loaded on focus
- After reload, the parser and syntax highlighting update automatically

---

## Error Handling

- **Syntax errors** in a plugin prevent it from loading. The error is captured silently — the plugin is skipped.
- **Runtime errors** (e.g., a function throws during evaluation) return `0` for that expression.
- **Timeout** (> 5 seconds) terminates the plugin load.
- If a plugin fails, all other plugins continue to work normally.

> **Tip:** use `numi.addTest()` to validate your plugin. Run `pnpm test` — the test suite includes all plugin tests.

---

## Directory Structure

```
packages/engine/src/
  core-plugins/
    types.ts                     # PluginManifest, MathFn, LineRefHandler, PluginTest types
    index.ts                     # Aggregates all core plugins
    math-functions/              # sqrt, sin, cos, log, abs, ceil, floor, round, ...
    math-constants/              # pi, e, tau
    units-length/                # meter, km, mile, inch, foot, yard, ...
    units-weight/                # kg, lb, oz, gram, ton, ...
    units-volume/                # liter, gallon, cup, ml, ...
    units-temperature/           # celsius, fahrenheit, kelvin
    units-area/                  # m², ft², acre, hectare, ...
    units-data/                  # byte, KB, MB, GB, TB, ...
    units-css/                   # px, rem, em, pt, vw, vh
    units-duration/              # second, minute, hour, day, week, month, year
    units-currency/              # USD, EUR, BRL, ... (live rates)
    line-references/             # sum, avg, prev, count, total
    date-literals/               # today, now, tomorrow, yesterday
    base-conversion/             # hex, binary, octal, decimal
    timezone/                    # UTC, EST, PST, BRT, JST, city names
  plugins/
    host.ts                      # PluginHost — VM sandbox, numi API
    loader.ts                    # PluginLoader — file discovery, hot-reload
  registry/
    entity-registry.ts           # Central EntityRegistry
    plugin-registrar.ts          # Loads PluginManifest → EntityRegistry

plugins/
  CommunityPlugins/              # Bundled community plugins (15+)
    Speed/                       # km/h, mph, knots, ...
    Pressure/                    # bar, psi, atm, pascal, ...
    DataRates/                   # bps, kbps, mbps, gbps, ...
    BasicCombinatorics/          # choose, permute
    ...

~/.ilumi-calc/plugins/           # User-installed plugins (auto-created)
```

---

## How Loading Works

1. `createEntityRegistry()` creates an `EntityRegistry` and loads all core plugins
2. `PluginHost` is created with the `EntityRegistry`
3. `PluginLoader` discovers `.js` files in bundled `CommunityPlugins/` and user plugins directory
4. Each community plugin runs in a VM sandbox with the `numi` API
5. `numi.addUnit()` / `numi.addFunction()` / `numi.addTest()` / `numi.addHelp()` register into the `EntityRegistry`
6. `Document.refreshParseOptions()` rebuilds parser options from the registry
7. The renderer receives entity info via IPC and updates syntax highlighting + autocomplete
8. On window focus, `PluginLoader.reload()` scans for new plugins
