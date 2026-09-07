export type { ASTNode } from "./ast.js";
export { parse } from "./parser/index.js";
export type { ParseOptions } from "./parser/index.js";
export { evaluateNode, EvalContext, EvalError } from "./evaluator/index.js";
export { Document } from "./document.js";
export { formatNumber, formatWithUnit } from "./formatter.js";
export type { FormatOptions } from "./formatter.js";
export { UnitRegistry } from "./units/index.js";
export type { UnitDefinition } from "./units/index.js";
export { PluginHost, PluginLoader } from "./plugins/index.js";
export type { PluginInfo, PluginLoaderOptions } from "./plugins/index.js";
export { EntityRegistry, registerPlugin } from "./registry/index.js";
export type { EntityInfo } from "./registry/index.js";
export { corePlugins, createCurrencyPlugin, runPluginTests } from "./core-plugins/index.js";
export type {
  PluginManifest,
  PluginTest,
  TestResult,
  MathFn,
  LineRefHandler,
  LineRefContext,
  LineResultEntry,
  HelpSection,
  HelpExample,
} from "./core-plugins/index.js";

export interface LineResult {
  line: number;
  value: number | null;
  formatted: string;
  error?: string;
  /** "syntax" when the line failed to parse, "eval" when it parsed but failed to evaluate. */
  errorKind?: "syntax" | "eval";
}

import { Document } from "./document.js";
import { corePlugins } from "./core-plugins/index.js";
import { EntityRegistry } from "./registry/index.js";
import { registerPlugin } from "./registry/index.js";

/** Create an EntityRegistry with all core plugins loaded. */
export function createEntityRegistry(): EntityRegistry {
  const registry = new EntityRegistry();
  for (const plugin of corePlugins) {
    registerPlugin(registry, plugin);
  }
  return registry;
}

export function evaluate(source: string): LineResult[] {
  const registry = createEntityRegistry();
  const doc = new Document(registry);
  return doc.update(source);
}
