import { describe, it, expect, beforeEach } from "vitest";

import { parse } from "../parser/index.js";

import { evaluateNode, EvalContext, EvalError } from "./index.js";

function evalExpr(input: string, context?: EvalContext): number | null {
  const ast = parse(input);
  return evaluateNode(ast, context ?? new EvalContext());
}

describe("evaluator", () => {
  describe("basic arithmetic", () => {
    it("should evaluate integers", () => {
      expect(evalExpr("42")).toBe(42);
    });

    it("should evaluate floats", () => {
      expect(evalExpr("3.14")).toBeCloseTo(3.14);
    });

    it("should evaluate addition", () => {
      expect(evalExpr("1 + 2")).toBe(3);
    });

    it("should evaluate subtraction", () => {
      expect(evalExpr("10 - 3")).toBe(7);
    });

    it("should evaluate multiplication", () => {
      expect(evalExpr("4 * 5")).toBe(20);
    });

    it("should evaluate division", () => {
      expect(evalExpr("20 / 4")).toBe(5);
    });

    it("should evaluate exponentiation", () => {
      expect(evalExpr("2 ^ 10")).toBe(1024);
    });

    it("should evaluate modulo", () => {
      expect(evalExpr("10 mod 3")).toBe(1);
    });
  });

  describe("unary operators", () => {
    it("should evaluate negative", () => {
      expect(evalExpr("-5")).toBe(-5);
    });

    it("should evaluate positive", () => {
      expect(evalExpr("+5")).toBe(5);
    });

    it("should evaluate double negative", () => {
      expect(evalExpr("-(-5)")).toBe(5);
    });
  });

  describe("operator precedence", () => {
    it("should respect multiplication over addition", () => {
      expect(evalExpr("1 + 2 * 3")).toBe(7);
    });

    it("should respect exponentiation over multiplication", () => {
      expect(evalExpr("2 * 3 ^ 2")).toBe(18);
    });

    it("should override precedence with parentheses", () => {
      expect(evalExpr("(1 + 2) * 3")).toBe(9);
    });

    it("should handle right-associative exponentiation", () => {
      expect(evalExpr("2 ^ 3 ^ 2")).toBe(512);
    });

    it("should handle complex expression", () => {
      expect(evalExpr("2 + 3 * 4 - 6 / 2")).toBe(11);
    });
  });

  describe("number formats", () => {
    it("should evaluate hex numbers", () => {
      expect(evalExpr("0xFF")).toBe(255);
    });

    it("should evaluate binary numbers", () => {
      expect(evalExpr("0b1010")).toBe(10);
    });

    it("should evaluate scientific notation", () => {
      expect(evalExpr("1.5e3")).toBe(1500);
    });

    it("should evaluate hex in expressions", () => {
      expect(evalExpr("0xFF + 1")).toBe(256);
    });

    it("should evaluate binary in expressions", () => {
      expect(evalExpr("0b1010 * 2")).toBe(20);
    });
  });

  describe("variables", () => {
    let context: EvalContext;

    beforeEach(() => {
      context = new EvalContext();
    });

    it("should assign and retrieve variables", () => {
      evalExpr("x = 42", context);
      expect(evalExpr("x", context)).toBe(42);
    });

    it("should use variables in expressions", () => {
      evalExpr("price = 100", context);
      evalExpr("tax = 8", context);
      expect(evalExpr("price + tax", context)).toBe(108);
    });

    it("should allow reassignment", () => {
      evalExpr("x = 10", context);
      evalExpr("x = 20", context);
      expect(evalExpr("x", context)).toBe(20);
    });

    it("should assign expression results", () => {
      evalExpr("total = 10 + 20 * 3", context);
      expect(evalExpr("total", context)).toBe(70);
    });

    it("should throw on undefined variable", () => {
      expect(() => evalExpr("unknown", context)).toThrow(EvalError);
      expect(() => evalExpr("unknown", context)).toThrow('Undefined variable "unknown"');
    });
  });

  describe("comments and empty lines", () => {
    it("should return null for comments", () => {
      expect(evalExpr("// this is a comment")).toBeNull();
    });

    it("should return null for hash comments", () => {
      expect(evalExpr("# another comment")).toBeNull();
    });

    it("should return null for empty input", () => {
      expect(evalExpr("")).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("should throw on division by zero", () => {
      expect(() => evalExpr("10 / 0")).toThrow(EvalError);
      expect(() => evalExpr("10 / 0")).toThrow("Division by zero");
    });

    it("should throw on modulo by zero", () => {
      expect(() => evalExpr("10 mod 0")).toThrow(EvalError);
      expect(() => evalExpr("10 mod 0")).toThrow("Modulo by zero");
    });

    it("should handle very large numbers", () => {
      expect(evalExpr("2 ^ 53")).toBe(9007199254740992);
    });

    it("should handle very small decimals", () => {
      expect(evalExpr("0.1 + 0.2")).toBeCloseTo(0.3);
    });

    it("should handle negative exponentiation", () => {
      expect(evalExpr("2 ^ -2")).toBeCloseTo(0.25);
    });

    it("should handle zero operations", () => {
      expect(evalExpr("0 + 0")).toBe(0);
      expect(evalExpr("0 * 100")).toBe(0);
      expect(evalExpr("0 ^ 5")).toBe(0);
    });

    it("should handle chained operations", () => {
      expect(evalExpr("1 + 2 + 3 + 4 + 5")).toBe(15);
    });
  });
});
