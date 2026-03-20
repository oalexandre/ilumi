export type { ASTNode } from "./ast.js";
export { parse } from "./parser/index.js";
export { evaluateNode, EvalContext, EvalError } from "./evaluator/index.js";
export { Document } from "./document.js";
export { formatNumber, formatWithUnit } from "./formatter.js";
export { UnitRegistry, createDefaultRegistry } from "./units/index.js";
export type { UnitDefinition } from "./units/index.js";
export { FunctionRegistry } from "./functions/index.js";
export { PluginHost, PluginLoader } from "./plugins/index.js";
export type { PluginInfo, PluginLoaderOptions } from "./plugins/index.js";

export interface LineResult {
  line: number;
  value: number | null;
  formatted: string;
  error?: string;
}

import { Document } from "./document.js";
import { createDefaultRegistry } from "./units/index.js";

export function evaluate(source: string): LineResult[] {
  const registry = createDefaultRegistry();
  const doc = new Document(registry);
  return doc.update(source);
}
