import type { ASTNode } from "../ast.js";
import { resolveDateLiteral } from "../dates/index.js";
import { FunctionRegistry, getConstant } from "../functions/index.js";
import type { UnitRegistry } from "../units/registry.js";

import { EvalContext } from "./context.js";

export { EvalContext } from "./context.js";

export class EvalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EvalError";
  }
}

export interface EvalResult {
  value: number | null;
  unit?: string;
}

export interface EvalOptions {
  unitRegistry?: UnitRegistry;
  /** Previous line results (values only) for line reference tokens */
  previousResults?: (number | null)[];
  /** Current line index */
  currentLine?: number;
}

const funcRegistry = new FunctionRegistry();

export function evaluateNode(
  node: ASTNode,
  context: EvalContext,
  options?: EvalOptions,
): number | null {
  return evaluateNodeFull(node, context, options).value;
}

export function evaluateNodeFull(
  node: ASTNode,
  context: EvalContext,
  options?: EvalOptions,
): EvalResult {
  switch (node.type) {
    case "number":
      return { value: node.value };

    case "numberWithUnit":
      return { value: node.value, unit: node.unit };

    case "conversion": {
      const targetLower = node.targetUnit.toLowerCase();

      // Base conversion: "255 in hex", "0xFF in binary", etc.
      const baseFormats: Record<string, (n: number) => string> = {
        hex: (n) => "0x" + Math.trunc(n).toString(16).toUpperCase(),
        hexadecimal: (n) => "0x" + Math.trunc(n).toString(16).toUpperCase(),
        binary: (n) => "0b" + (Math.trunc(n) >>> 0).toString(2),
        bin: (n) => "0b" + (Math.trunc(n) >>> 0).toString(2),
        octal: (n) => "0o" + Math.trunc(n).toString(8),
        oct: (n) => "0o" + Math.trunc(n).toString(8),
        decimal: (n) => String(Math.trunc(n)),
        dec: (n) => String(Math.trunc(n)),
      };

      const baseFormatter = baseFormats[targetLower];
      if (baseFormatter) {
        const inner = evaluateNodeFull(node.value, context, options);
        if (inner.value === null) throw new EvalError("Cannot convert empty value");
        const formatted = baseFormatter(inner.value);
        return { value: inner.value, unit: formatted };
      }

      // Unit conversion
      const inner = evaluateNodeFull(node.value, context, options);
      if (inner.value === null) {
        throw new EvalError("Cannot convert empty value");
      }
      const unitReg = options?.unitRegistry;
      if (!unitReg) {
        throw new EvalError("Unit conversion not available");
      }
      if (!inner.unit) {
        throw new EvalError("Value has no unit to convert from");
      }
      const fromUnit = unitReg.findByPhrase(inner.unit);
      const toUnit = unitReg.findByPhrase(node.targetUnit);
      if (!fromUnit) throw new EvalError(`Unknown unit "${inner.unit}"`);
      if (!toUnit) throw new EvalError(`Unknown unit "${node.targetUnit}"`);
      const converted = unitReg.convert(inner.value, fromUnit.id, toUnit.id);
      return { value: converted, unit: toUnit.format };
    }

    case "binary":
      return { value: evaluateBinary(node.op, node.left, node.right, context, options) };

    case "unary":
      return { value: evaluateUnary(node.op, node.value, context, options) };

    case "assignment": {
      const result = evaluateNodeFull(node.value, context, options);
      if (result.value === null) {
        throw new EvalError(`Cannot assign empty value to "${node.name}"`);
      }
      context.set(node.name, result.value);
      return result;
    }

    case "variable": {
      const constant = getConstant(node.name);
      if (constant !== undefined) {
        return { value: constant };
      }
      const value = context.get(node.name);
      if (value === undefined) {
        throw new EvalError(`Undefined variable "${node.name}"`);
      }
      return { value };
    }

    case "call": {
      const args = node.args.map((arg) => {
        const val = evaluateNode(arg, context, options);
        if (val === null) {
          throw new EvalError(`Cannot pass empty value to function "${node.name}"`);
        }
        return val;
      });
      return { value: funcRegistry.call(node.name, args) };
    }

    case "percent": {
      const value = evaluateNode(node.value, context, options);
      if (value === null) {
        throw new EvalError("Cannot apply percent to empty value");
      }
      return { value: value / 100 };
    }

    case "percentOp": {
      const base = evaluateNode(node.base, context, options);
      const target = evaluateNode(node.target, context, options);
      if (base === null || target === null) {
        throw new EvalError("Cannot apply percent operation to empty value");
      }
      const pct = base / 100;
      switch (node.op) {
        case "of":
          return { value: pct * target };
        case "off":
          return { value: target - pct * target };
        case "on":
          return { value: target + pct * target };
      }
    }

    case "date": {
      const date = resolveDateLiteral(node.keyword);
      return { value: date.getTime() };
    }

    case "lineRef": {
      const prev = options?.previousResults ?? [];
      const currentLine = options?.currentLine ?? prev.length;
      const above = prev.slice(0, currentLine).filter((v): v is number => v !== null);

      switch (node.ref) {
        case "sum":
        case "total":
          return { value: above.reduce((a, b) => a + b, 0) };
        case "avg":
        case "average":
          return { value: above.length > 0 ? above.reduce((a, b) => a + b, 0) / above.length : 0 };
        case "prev":
        case "previous": {
          for (let i = currentLine - 1; i >= 0; i--) {
            const val = prev[i];
            if (val !== null && val !== undefined) return { value: val };
          }
          return { value: 0 };
        }
        case "count":
          return { value: above.length };
        default:
          throw new EvalError(`Unknown line reference "${node.ref}"`);
      }
    }

    case "comment":
    case "empty":
      return { value: null };

    default: {
      const exhaustive: never = node;
      throw new EvalError(`Unknown node type: ${(exhaustive as ASTNode).type}`);
    }
  }
}

function evaluateBinary(
  op: string,
  left: ASTNode,
  right: ASTNode,
  context: EvalContext,
  options?: EvalOptions,
): number {
  // Special case: 100 + 5% means 100 * 1.05, 100 - 5% means 100 * 0.95
  if ((op === "+" || op === "-") && right.type === "percent") {
    const l = evaluateNode(left, context, options);
    const pctValue = evaluateNode(right.value, context, options);
    if (l === null || pctValue === null) {
      throw new EvalError("Cannot perform operation on empty value");
    }
    const pct = pctValue / 100;
    return op === "+" ? l * (1 + pct) : l * (1 - pct);
  }

  const l = evaluateNode(left, context, options);
  const r = evaluateNode(right, context, options);

  if (l === null || r === null) {
    throw new EvalError("Cannot perform operation on empty value");
  }

  switch (op) {
    case "+":
      return l + r;
    case "-":
      return l - r;
    case "*":
      return l * r;
    case "/":
      if (r === 0) {
        throw new EvalError("Division by zero");
      }
      return l / r;
    case "^":
      return Math.pow(l, r);
    case "mod":
      if (r === 0) {
        throw new EvalError("Modulo by zero");
      }
      return l % r;
    case "AND":
      return (Math.trunc(l) & Math.trunc(r)) >>> 0;
    case "OR":
      return (Math.trunc(l) | Math.trunc(r)) >>> 0;
    case "XOR":
      return (Math.trunc(l) ^ Math.trunc(r)) >>> 0;
    case "<<":
      return (Math.trunc(l) << Math.trunc(r)) >>> 0;
    case ">>":
      return Math.trunc(l) >> Math.trunc(r);
    default:
      throw new EvalError(`Unknown operator "${op}"`);
  }
}

function evaluateUnary(
  op: string,
  value: ASTNode,
  context: EvalContext,
  options?: EvalOptions,
): number {
  const v = evaluateNode(value, context, options);
  if (v === null) {
    throw new EvalError("Cannot apply unary operator to empty value");
  }

  switch (op) {
    case "-":
      return -v;
    case "+":
      return v;
    case "NOT":
      return ~Math.trunc(v) >>> 0;
    default:
      throw new EvalError(`Unknown unary operator "${op}"`);
  }
}
