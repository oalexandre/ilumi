export type { ASTNode } from "./ast.js";
export { parse } from "./parser/index.js";
export { evaluateNode, EvalContext, EvalError } from "./evaluator/index.js";

export interface LineResult {
  line: number;
  value: number | null;
  formatted: string;
  error?: string;
}

import { parse } from "./parser/index.js";
import { evaluateNode, EvalContext } from "./evaluator/index.js";

export function evaluate(document: string): LineResult[] {
  const lines = document.split("\n");
  const context = new EvalContext();

  return lines.map((line, index) => {
    try {
      const ast = parse(line);
      const value = evaluateNode(ast, context);
      return {
        line: index,
        value,
        formatted: value !== null ? String(value) : "",
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return {
        line: index,
        value: null,
        formatted: "",
        error: message,
      };
    }
  });
}
