import type { ASTNode } from "../ast.js";
import type { EntityRegistry } from "../registry/entity-registry.js";

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
  isPercent?: boolean;
}

export interface EvalOptions {
  entityRegistry?: EntityRegistry;
  /** Previous line results for line reference tokens */
  previousResults?: (import("../core-plugins/types.js").LineResultEntry | null)[];
  /** Current line index */
  currentLine?: number;
}

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
  const entityReg = options?.entityRegistry;

  switch (node.type) {
    case "number":
      return { value: node.value };

    case "numberWithUnit":
      return { value: node.value, unit: node.unit };

    case "expressionWithUnit": {
      const exprResult = evaluateNodeFull(node.expression, context, options);
      if (exprResult.value === null) {
        throw new EvalError("Cannot attach unit to empty value");
      }
      return { value: exprResult.value, unit: node.unit };
    }

    case "conversion": {
      const targetLower = node.targetUnit.toLowerCase();

      // Base conversion: "255 in hex", "now in UTC", etc.
      const baseFormatter = entityReg?.getBaseFormatter(targetLower);
      if (baseFormatter) {
        const inner = evaluateNodeFull(node.value, context, options);
        if (inner.value === null) throw new EvalError("Cannot convert empty value");
        const formatted = baseFormatter(inner.value);
        return { value: inner.value, unit: `__fmt__${formatted}` };
      }

      // Unit conversion
      const inner = evaluateNodeFull(node.value, context, options);
      if (inner.value === null) {
        throw new EvalError("Cannot convert empty value");
      }
      const unitReg = entityReg?.getUnitRegistry();
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
      return evaluateBinary(node.op, node.left, node.right, context, options);

    case "unary":
      return { value: evaluateUnary(node.op, node.value, context, options) };

    case "assignment": {
      const result = evaluateNodeFull(node.value, context, options);
      if (result.value === null) {
        throw new EvalError(`Cannot assign empty value to "${node.name}"`);
      }
      context.set(node.name, {
        value: result.value,
        unit: result.unit,
        isPercent: result.isPercent,
      });
      return result;
    }

    case "variable": {
      if (entityReg) {
        const constant = entityReg.getConstantValue(node.name);
        if (constant !== undefined) {
          return { value: constant };
        }
      }
      const stored = context.get(node.name);
      if (stored === undefined) {
        throw new EvalError(`Undefined variable "${node.name}"`);
      }
      return { value: stored.value, unit: stored.unit, isPercent: stored.isPercent };
    }

    case "call": {
      if (!entityReg) {
        throw new EvalError(`Function "${node.name}" requires entity registry`);
      }
      const args = node.args.map((arg) => {
        const val = evaluateNode(arg, context, options);
        if (val === null) {
          throw new EvalError(`Cannot pass empty value to function "${node.name}"`);
        }
        return val;
      });
      return { value: entityReg.callFunction(node.name, args) };
    }

    case "percent": {
      const value = evaluateNode(node.value, context, options);
      if (value === null) {
        throw new EvalError("Cannot apply percent to empty value");
      }
      return { value: value / 100, isPercent: true };
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
      if (!entityReg) {
        throw new EvalError(`Date literal "${node.keyword}" requires entity registry`);
      }
      const date = entityReg.resolveDateLiteral(node.keyword);
      return { value: date.getTime(), unit: "__date__" };
    }

    case "lineRef": {
      if (!entityReg) {
        throw new EvalError(`Line reference "${node.ref}" requires entity registry`);
      }
      const prev = options?.previousResults ?? [];
      const currentLine = options?.currentLine ?? prev.length;
      return { value: entityReg.resolveLineRef(node.ref, prev, currentLine) };
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

/** Convert a numberWithUnit to its base unit value (e.g., 1 day → 86400000 ms). */
function toBaseValue(value: number, unit: string, entityReg?: EntityRegistry): number {
  if (!entityReg) return value;
  const unitReg = entityReg.getUnitRegistry();
  const unitDef = unitReg.findByPhrase(unit);
  if (!unitDef) return value;
  return unitDef.toBase ? unitDef.toBase(value) : value * unitDef.ratio;
}

/** Check if a unit is a duration (baseUnitId is "millisecond"). */
function isDurationUnit(unit: string, entityReg?: EntityRegistry): boolean {
  if (!entityReg) return false;
  const unitDef = entityReg.getUnitRegistry().findByPhrase(unit);
  return unitDef?.baseUnitId === "millisecond";
}

function evaluateBinary(
  op: string,
  left: ASTNode,
  right: ASTNode,
  context: EvalContext,
  options?: EvalOptions,
): EvalResult {
  const entityReg = options?.entityRegistry;

  // Special case: 100 + 5% means 100 * 1.05, 100 - 5% means 100 * 0.95
  if ((op === "+" || op === "-") && right.type === "percent") {
    const l = evaluateNode(left, context, options);
    const pctValue = evaluateNode(right.value, context, options);
    if (l === null || pctValue === null) {
      throw new EvalError("Cannot perform operation on empty value");
    }
    const pct = pctValue / 100;
    return { value: op === "+" ? l * (1 + pct) : l * (1 - pct) };
  }

  const leftResult = evaluateNodeFull(left, context, options);
  const rightResult = evaluateNodeFull(right, context, options);

  // Special case: value + percentVariable (e.g., price + tax where tax = 10%)
  if ((op === "+" || op === "-") && rightResult.isPercent) {
    if (leftResult.value === null || rightResult.value === null) {
      throw new EvalError("Cannot perform operation on empty value");
    }
    const l = leftResult.value;
    const pct = rightResult.value;
    return { value: op === "+" ? l * (1 + pct) : l * (1 - pct) };
  }

  if (leftResult.value === null || rightResult.value === null) {
    throw new EvalError("Cannot perform operation on empty value");
  }

  let l = leftResult.value;
  let r = rightResult.value;

  // Date ± duration arithmetic: convert duration to milliseconds
  if (op === "+" || op === "-") {
    const leftIsDate = leftResult.unit === "__date__";
    const rightIsDate = rightResult.unit === "__date__";

    if (leftIsDate && rightResult.unit && isDurationUnit(rightResult.unit, entityReg)) {
      r = toBaseValue(rightResult.value, rightResult.unit, entityReg);
    }
    if (rightIsDate && leftResult.unit && isDurationUnit(leftResult.unit, entityReg)) {
      l = toBaseValue(leftResult.value, leftResult.unit, entityReg);
    }

    // Determine result unit: date ± duration = date, date - date = duration
    if (op === "+" && (leftIsDate || rightIsDate)) {
      return { value: l + r, unit: "__date__" };
    }
    if (op === "-" && leftIsDate && !rightIsDate) {
      return { value: l - r, unit: "__date__" };
    }
    // date - date = plain number (duration in ms)
  }

  switch (op) {
    case "+":
      return { value: l + r };
    case "-":
      return { value: l - r };
    case "*":
      return { value: l * r };
    case "/":
      if (r === 0) {
        throw new EvalError("Division by zero");
      }
      return { value: l / r };
    case "^":
      return { value: Math.pow(l, r) };
    case "mod":
      if (r === 0) {
        throw new EvalError("Modulo by zero");
      }
      return { value: l % r };
    case "AND":
      return { value: (Math.trunc(l) & Math.trunc(r)) >>> 0 };
    case "OR":
      return { value: (Math.trunc(l) | Math.trunc(r)) >>> 0 };
    case "XOR":
      return { value: (Math.trunc(l) ^ Math.trunc(r)) >>> 0 };
    case "<<":
      return { value: (Math.trunc(l) << Math.trunc(r)) >>> 0 };
    case ">>":
      return { value: Math.trunc(l) >> Math.trunc(r) };
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
