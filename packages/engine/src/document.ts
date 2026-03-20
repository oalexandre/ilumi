import type { ASTNode } from "./ast.js";
import { EvalContext } from "./evaluator/context.js";
import { evaluateNodeFull } from "./evaluator/index.js";
import type { EvalOptions } from "./evaluator/index.js";
import { formatNumber, formatWithUnit } from "./formatter.js";
import { parse } from "./parser/index.js";
import type { UnitRegistry } from "./units/registry.js";

import type { LineResult } from "./index.js";

function isBaseFormatted(unit: string): boolean {
  return /^(0x[0-9A-Fa-f]+|0b[01]+|0o[0-7]+|-?\d+)$/.test(unit);
}

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
      case "conversion":
        walk(n.value);
        break;
      case "number":
      case "numberWithUnit":
      case "date":
      case "lineRef":
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
  private unitRegistry?: UnitRegistry;
  private knownUnits?: Set<string>;

  constructor(unitRegistry?: UnitRegistry) {
    this.unitRegistry = unitRegistry;
    if (unitRegistry) {
      this.knownUnits = new Set(unitRegistry.getAllPhrases());
    }
  }

  getResults(): LineResult[] {
    return this.lines.map((l) => l.result);
  }

  update(source: string): LineResult[] {
    const newLines = source.split("\n");
    const dirty = new Set<number>();

    for (let i = 0; i < newLines.length; i++) {
      const newSource = newLines[i] ?? "";
      const existing = this.lines[i];
      if (!existing || existing.source !== newSource) {
        dirty.add(i);
      }
    }

    if (newLines.length !== this.lines.length) {
      for (let i = newLines.length; i < this.lines.length; i++) {
        dirty.add(i);
      }
    }

    this.lines.length = newLines.length;

    for (const i of dirty) {
      const src = newLines[i] ?? "";
      try {
        const ast = parse(src, { knownUnits: this.knownUnits });
        this.lines[i] = {
          source: src,
          ast,
          result: { line: i, value: null, formatted: "" },
          defines: ast.type === "assignment" ? ast.name : undefined,
          references: collectVariableRefs(ast),
        };
      } catch {
        this.lines[i] = {
          source: src,
          ast: null,
          result: { line: i, value: null, formatted: "", error: "Syntax error" },
          references: new Set(),
        };
      }
    }

    const changedVars = new Set<string>();
    for (const i of dirty) {
      const line = this.lines[i];
      if (line?.defines) {
        changedVars.add(line.defines);
      }
    }

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

    const previousResults: (number | null)[] = new Array(this.lines.length).fill(null);

    this.context.clear();
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      if (!line || !line.ast) continue;

      const evalOpts: EvalOptions = {
        unitRegistry: this.unitRegistry,
        previousResults,
        currentLine: i,
      };

      try {
        const result = evaluateNodeFull(line.ast, this.context, evalOpts);
        let formatted = "";
        if (result.value !== null) {
          if (result.unit && isBaseFormatted(result.unit)) {
            formatted = result.unit;
          } else if (result.unit) {
            formatted = formatWithUnit(result.value, result.unit);
          } else {
            formatted = formatNumber(result.value);
          }
        }
        line.result = {
          line: i,
          value: result.value,
          formatted,
        };
        previousResults[i] = result.value;
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
