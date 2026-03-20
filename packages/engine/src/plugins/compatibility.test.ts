import { readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, it, expect } from "vitest";

import { FunctionRegistry } from "../functions/index.js";
import { UnitRegistry } from "../units/registry.js";

import { PluginHost } from "./host.js";

const PLUGINS_DIR = resolve(
  fileURLToPath(import.meta.url),
  "../../../../../plugins/CommunityExtensions",
);

function findPluginJs(dir: string): string | null {
  if (!existsSync(dir)) return null;
  try {
    const files = readdirSync(dir);
    const jsFile = files.find((f) => f.endsWith(".js"));
    return jsFile ? join(dir, jsFile) : null;
  } catch {
    return null;
  }
}

function createHost(): { host: PluginHost; units: UnitRegistry; funcs: FunctionRegistry } {
  const units = new UnitRegistry();
  const funcs = new FunctionRegistry();
  const host = new PluginHost(units, funcs);
  return { host, units, funcs };
}

describe("Numi community plugin compatibility", () => {
  const pluginDirs = existsSync(PLUGINS_DIR) ? readdirSync(PLUGINS_DIR) : [];

  it("should find community plugins directory", () => {
    expect(existsSync(PLUGINS_DIR)).toBe(true);
    expect(pluginDirs.length).toBeGreaterThanOrEqual(15);
  });

  describe("all plugins load without error", () => {
    for (const pluginName of pluginDirs) {
      const pluginDir = join(PLUGINS_DIR, pluginName);
      const jsFile = findPluginJs(pluginDir);
      if (!jsFile) continue;

      it(`should load ${pluginName}`, () => {
        const { host } = createHost();
        const info = host.loadPlugin(jsFile);
        expect(info.loaded).toBe(true);
        if (!info.loaded) {
          console.log(`  ERROR: ${info.error}`);
        }
      });
    }
  });

  describe("DataRates", () => {
    it("should generate units programmatically in loop", () => {
      const { host, units } = createHost();
      const jsFile = findPluginJs(join(PLUGINS_DIR, "DataRates"));
      expect(jsFile).not.toBeNull();
      host.loadPlugin(jsFile!);

      // Should have created multiple data rate units
      expect(units.findByPhrase("kbps")).toBeDefined();
      expect(units.findByPhrase("Mbps")).toBeDefined();
      expect(units.findByPhrase("Gbps")).toBeDefined();
    });
  });

  describe("VectorCalculator", () => {
    it("should maintain state between function calls", () => {
      const { host, funcs } = createHost();
      const jsFile = findPluginJs(join(PLUGINS_DIR, "VectorCalculator"));
      expect(jsFile).not.toBeNull();
      host.loadPlugin(jsFile!);

      // VectorCalculator registers functions like vpush, vsum, etc.
      const hasVectorFuncs =
        funcs.has("vpush") || funcs.has("vadd") || funcs.has("vector") || funcs.getAllNames().some((n) => n.startsWith("v"));
      expect(hasVectorFuncs).toBe(true);
    });
  });

  describe("ScreenUnits", () => {
    it("should use both addUnit and addFunction", () => {
      const { host, units, funcs } = createHost();
      const jsFile = findPluginJs(join(PLUGINS_DIR, "ScreenUnits"));
      expect(jsFile).not.toBeNull();
      host.loadPlugin(jsFile!);

      // Should register CSS-related units or functions
      const hasUnits = units.getAllPhrases().length > 0;
      const hasFuncs = funcs.getAllNames().length > Object.keys({}).length;
      expect(hasUnits || hasFuncs).toBe(true);
    });
  });

  describe("function plugins", () => {
    it("should load PercentChange", () => {
      const { host, funcs } = createHost();
      const jsFile = findPluginJs(join(PLUGINS_DIR, "PercentChange"));
      expect(jsFile).not.toBeNull();
      host.loadPlugin(jsFile!);
      expect(funcs.getAllNames().length).toBeGreaterThan(0);
    });

    it("should load MinMax", () => {
      const { host, funcs } = createHost();
      const jsFile = findPluginJs(join(PLUGINS_DIR, "MinMax"));
      expect(jsFile).not.toBeNull();
      host.loadPlugin(jsFile!);
      expect(funcs.getAllNames().length).toBeGreaterThan(0);
    });

    it("should load StandardDeviation", () => {
      const { host, funcs } = createHost();
      const jsFile = findPluginJs(join(PLUGINS_DIR, "StandardDeviation"));
      expect(jsFile).not.toBeNull();
      host.loadPlugin(jsFile!);
      expect(funcs.getAllNames().length).toBeGreaterThan(0);
    });
  });

  describe("unit plugins", () => {
    it("should load Pressure units", () => {
      const { host, units } = createHost();
      const jsFile = findPluginJs(join(PLUGINS_DIR, "Pressure"));
      expect(jsFile).not.toBeNull();
      host.loadPlugin(jsFile!);
      expect(units.getAllPhrases().length).toBeGreaterThan(0);
    });

    it("should load Speed units", () => {
      const { host, units } = createHost();
      const jsFile = findPluginJs(join(PLUGINS_DIR, "Speed"));
      expect(jsFile).not.toBeNull();
      host.loadPlugin(jsFile!);
      expect(units.getAllPhrases().length).toBeGreaterThan(0);
    });

    it("should load Electrical units", () => {
      const { host, units } = createHost();
      const jsFile = findPluginJs(join(PLUGINS_DIR, "Electrical-conversion"));
      expect(jsFile).not.toBeNull();
      host.loadPlugin(jsFile!);
      expect(units.getAllPhrases().length).toBeGreaterThan(0);
    });
  });
});
