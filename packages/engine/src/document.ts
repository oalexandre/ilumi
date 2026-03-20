import type { ASTNode } from "./ast.js";
import { EvalContext } from "./evaluator/context.js";
import { evaluateNode } from "./evaluator/index.js";
import { formatNumber } from "./formatter.js";
import { parse } from "./parser/index.js";

import type { LineResult } from "./index.js";

interface LineState {
  source: string;
  ast: ASTNode | null;
  result: LineResult;
  defines?: string;
  references: Set<string>;
}

function collectVariableRefs(node: ASTNode): Set<string> {
  const refs = new Set<string>();

  function walk(n: ASTNode): void {
    switch (n.type) {
      case "variable":
        refs.add(n.name);
        break;
      case "binary":
        walk(n.left);
        walk(n.right);
        break;
      case "unary":
        walk(n.value);
        break;
      case "assignment":
        walk(n.value);
        break;
      case "call":
        n.args.forEach(walk);
        break;
      case "percent":
        walk(n.value);
        break;
      case "percentOp":
        walk(n.base);
        walk(n.target);
        break;
      case "number":
      case "comment":
      case "empty":
        break;
    }
  }

  walk(node);
  return refs;
}

export class Document {
  private lines: LineState[] = [];
  private context = new EvalContext();

  getResults(): LineResult[] {
    return this.lines.map((l) => l.result);
  }

  update(source: string): LineResult[] {
    const newLines = source.split("\n");
    const dirty = new Set<number>();

    // Detect changed lines
    for (let i = 0; i < newLines.length; i++) {
      const newSource = newLines[i] ?? "";
      const existing = this.lines[i];
      if (!existing || existing.source !== newSource) {
        dirty.add(i);
      }
    }

    // If line count changed, mark removed lines and rebuild
    if (newLines.length !== this.lines.length) {
      for (let i = newLines.length; i < this.lines.length; i++) {
        dirty.add(i);
      }
    }

    // Resize lines array
    this.lines.length = newLines.length;

    // Parse dirty lines
    for (const i of dirty) {
      const source = newLines[i] ?? "";
      try {
        const ast = parse(source);
        this.lines[i] = {
          source,
          ast,
          result: { line: i, value: null, formatted: "" },
          defines: ast.type === "assignment" ? ast.name : undefined,
          references: collectVariableRefs(ast),
        };
      } catch {
        this.lines[i] = {
          source,
          ast: null,
          result: { line: i, value: null, formatted: "", error: "Syntax error" },
          references: new Set(),
        };
      }
    }

    // Find which variables are defined by dirty lines
    const changedVars = new Set<string>();
    for (const i of dirty) {
      const line = this.lines[i];
      if (line?.defines) {
        changedVars.add(line.defines);
      }
    }

    // Mark lines that reference changed variables as dirty too
    if (changedVars.size > 0) {
      for (let i = 0; i < this.lines.length; i++) {
        if (!dirty.has(i)) {
          const line = this.lines[i];
          if (line) {
            for (const ref of line.references) {
              if (changedVars.has(ref)) {
                dirty.add(i);
                break;
              }
            }
          }
        }
      }
    }

    // Re-evaluate all lines sequentially (context is order-dependent)
    // We must evaluate all lines in order since variables accumulate
    this.context.clear();
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      if (!line || !line.ast) continue;

      try {
        const value = evaluateNode(line.ast, this.context);
        line.result = {
          line: i,
          value,
          formatted: value !== null ? formatNumber(value) : "",
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        line.result = {
          line: i,
          value: null,
          formatted: "",
          error: message,
        };
      }
    }

    return this.getResults();
  }
}
