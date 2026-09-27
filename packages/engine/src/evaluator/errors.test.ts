import { describe, it, expect } from "vitest";

import type { ASTNode } from "../ast.js";
import { createEntityRegistry } from "../index.js";
import { parse } from "../parser/index.js";
import type { EntityRegistry } from "../registry/entity-registry.js";

import { evaluateNodeFull, EvalContext, EvalError } from "./index.js";
import type { EvalOptions } from "./index.js";

const registry: EntityRegistry = createEntityRegistry();

function parseWith(input: string, reg: EntityRegistry = registry): ASTNode {
  return parse(input, {
    knownUnits: reg.getKnownUnits(),
    knownFunctions: reg.getKnownFunctions(),
    knownConstants: reg.getKnownConstants(),
    knownDateLiterals: reg.getKnownDateLiterals(),
    knownLineRefs: reg.getKnownLineRefs(),
    knownBaseKeywords: reg.getKnownBaseKeywords(),
  });
}

function run(node: ASTNode, options: EvalOptions = { entityRegistry: registry }) {
  return evaluateNodeFull(node, new EvalContext(), options);
}

/** Evaluate and return the thrown error (fails the test if nothing is thrown). */
function errorOf(node: ASTNode, options?: EvalOptions): Error {
  try {
    run(node, options);
  } catch (err) {
    return err as Error;
  }
  throw new Error("expected evaluation to throw");
}

const EMPTY: ASTNode = { type: "empty" };
const COMMENT: ASTNode = { type: "comment", text: "note" };
const num = (value: number): ASTNode => ({ type: "number", value });

describe("evaluator error paths", () => {
  describe("unit conversion", () => {
    it("rejects converting a plain number to a unit", () => {
      const err = errorOf(parseWith("5 in km"));
      expect(err).toBeInstanceOf(EvalError);
      expect(err.message).toBe("Value has no unit to convert from");
    });

    it("rejects an unknown target unit", () => {
      const node: ASTNode = {
        type: "conversion",
        value: { type: "numberWithUnit", value: 5, unit: "km" },
        targetUnit: "furlongz",
      };
      expect(errorOf(node).message).toBe('Unknown unit "furlongz"');
    });

    it("rejects an unknown source unit", () => {
      const node: ASTNode = {
        type: "conversion",
        value: { type: "numberWithUnit", value: 5, unit: "blorps" },
        targetUnit: "km",
      };
      expect(errorOf(node).message).toBe('Unknown unit "blorps"');
    });

    it("rejects converting across dimensions", () => {
      expect(errorOf(parseWith("5 km in kg")).message).toBe(
        'Cannot convert between "km" and "kg" (incompatible units)',
      );
    });

    it("rejects conversion without an entity registry", () => {
      const node: ASTNode = {
        type: "conversion",
        value: { type: "numberWithUnit", value: 5, unit: "km" },
        targetUnit: "m",
      };
      expect(errorOf(node, {}).message).toBe("Unit conversion not available");
    });

    it("rejects converting an empty value, both for units and base formatters", () => {
      expect(errorOf({ type: "conversion", value: EMPTY, targetUnit: "km" }).message).toBe(
        "Cannot convert empty value",
      );
      expect(errorOf({ type: "conversion", value: COMMENT, targetUnit: "hex" }).message).toBe(
        "Cannot convert empty value",
      );
    });

    it("rejects attaching a unit to an empty value", () => {
      const err = errorOf({ type: "expressionWithUnit", expression: EMPTY, unit: "km" });
      expect(err).toBeInstanceOf(EvalError);
      expect(err.message).toBe("Cannot attach unit to empty value");
    });
  });

  describe("unit arithmetic", () => {
    it("rejects adding or subtracting incompatible units", () => {
      expect(errorOf(parseWith("5 km - 3 kg")).message).toBe('Cannot subtract "kg" and "km"');
      expect(errorOf(parseWith("5 km + 3 kg")).message).toBe('Cannot add "kg" and "km"');
    });

    it("converts compatible units into the left operand's unit", () => {
      expect(run(parseWith("1 km - 250 m"))).toEqual({ value: 0.75, unit: "km" });
    });
  });

  describe("empty operands", () => {
    it("rejects functions called with empty arguments", () => {
      const node: ASTNode = { type: "call", name: "sqrt", args: [EMPTY] };
      expect(errorOf(node).message).toBe('Cannot pass empty value to function "sqrt"');
    });

    it("rejects percent of an empty value", () => {
      expect(errorOf({ type: "percent", value: EMPTY }).message).toBe(
        "Cannot apply percent to empty value",
      );
    });

    it("rejects percent operations with an empty side", () => {
      for (const op of ["of", "off", "on"] as const) {
        expect(errorOf({ type: "percentOp", op, base: EMPTY, target: num(10) }).message).toBe(
          "Cannot apply percent operation to empty value",
        );
        expect(errorOf({ type: "percentOp", op, base: num(10), target: COMMENT }).message).toBe(
          "Cannot apply percent operation to empty value",
        );
      }
    });

    it("rejects binary operations with an empty side", () => {
      expect(errorOf({ type: "binary", op: "*", left: EMPTY, right: num(2) }).message).toBe(
        "Cannot perform operation on empty value",
      );
      expect(
        errorOf({ type: "binary", op: "+", left: EMPTY, right: { type: "percent", value: num(5) } })
          .message,
      ).toBe("Cannot perform operation on empty value");
    });

    it("rejects unary operators on an empty value", () => {
      expect(errorOf({ type: "unary", op: "-", value: EMPTY }).message).toBe(
        "Cannot apply unary operator to empty value",
      );
    });

    it("rejects assigning an empty value", () => {
      expect(errorOf({ type: "assignment", name: "x", value: EMPTY }).message).toBe(
        'Cannot assign empty value to "x"',
      );
    });
  });

  describe("missing entity registry", () => {
    it("rejects function calls", () => {
      expect(errorOf({ type: "call", name: "sqrt", args: [num(4)] }, {}).message).toBe(
        'Function "sqrt" requires entity registry',
      );
    });

    it("rejects date literals", () => {
      expect(errorOf({ type: "date", keyword: "today" }, {}).message).toBe(
        'Date literal "today" requires entity registry',
      );
    });

    it("rejects line references that are not shadowed by a variable", () => {
      expect(errorOf({ type: "lineRef", ref: "prev" }, {}).message).toBe(
        'Line reference "prev" requires entity registry',
      );
    });

    it("still resolves a line-ref keyword shadowed by a variable", () => {
      const context = new EvalContext();
      context.set("total", { value: 42, unit: "km" });
      expect(evaluateNodeFull({ type: "lineRef", ref: "total" }, context, {})).toEqual({
        value: 42,
        unit: "km",
        isPercent: undefined,
      });
    });
  });

  describe("unknown operators and names", () => {
    it("rejects an unknown binary operator", () => {
      expect(errorOf({ type: "binary", op: "??", left: num(1), right: num(2) }).message).toBe(
        'Unknown operator "??"',
      );
    });

    it("rejects an unknown unary operator", () => {
      expect(errorOf({ type: "unary", op: "!", value: num(1) }).message).toBe(
        'Unknown unary operator "!"',
      );
    });

    it("rejects an unknown node type", () => {
      expect(errorOf({ type: "bogus" } as unknown as ASTNode).message).toBe(
        "Unknown node type: bogus",
      );
    });

    it("rejects an undefined variable", () => {
      expect(errorOf({ type: "variable", name: "nope" }).message).toBe('Undefined variable "nope"');
    });

    it("rejects modulo by zero", () => {
      expect(errorOf({ type: "binary", op: "mod", left: num(5), right: num(0) }).message).toBe(
        "Modulo by zero",
      );
    });
  });
});
