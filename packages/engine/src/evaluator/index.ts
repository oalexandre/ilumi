import type { ASTNode } from "../ast.js";

import { EvalContext } from "./context.js";

export { EvalContext } from "./context.js";

export class EvalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EvalError";
  }
}

export function evaluateNode(node: ASTNode, context: EvalContext): number | null {
  switch (node.type) {
    case "number":
      return node.value;

    case "binary":
      return evaluateBinary(node.op, node.left, node.right, context);

    case "unary":
      return evaluateUnary(node.op, node.value, context);

    case "assignment": {
      const value = evaluateNode(node.value, context);
      if (value === null) {
        throw new EvalError(`Cannot assign empty value to "${node.name}"`);
      }
      context.set(node.name, value);
      return value;
    }

    case "variable": {
      const value = context.get(node.name);
      if (value === undefined) {
        throw new EvalError(`Undefined variable "${node.name}"`);
      }
      return value;
    }

    case "comment":
    case "empty":
      return null;

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
): number {
  const l = evaluateNode(left, context);
  const r = evaluateNode(right, context);

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
    default:
      throw new EvalError(`Unknown operator "${op}"`);
  }
}

function evaluateUnary(op: string, value: ASTNode, context: EvalContext): number {
  const v = evaluateNode(value, context);
  if (v === null) {
    throw new EvalError("Cannot apply unary operator to empty value");
  }

  switch (op) {
    case "-":
      return -v;
    case "+":
      return v;
    default:
      throw new EvalError(`Unknown unary operator "${op}"`);
  }
}
