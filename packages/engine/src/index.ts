export type { ASTNode } from "./ast.js";
export { parse } from "./parser/index.js";
export { evaluateNode, EvalContext, EvalError } from "./evaluator/index.js";
export { Document } from "./document.js";
export { formatNumber, formatWithUnit } from "./formatter.js";

export interface LineResult {
  line: number;
  value: number | null;
  formatted: string;
  error?: string;
}

import { Document } from "./document.js";

export function evaluate(source: string): LineResult[] {
  const doc = new Document();
  return doc.update(source);
}
