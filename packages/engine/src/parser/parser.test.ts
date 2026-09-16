import { describe, it, expect } from "vitest";

import { parse } from "./index.js";

describe("parser", () => {
  describe("performance", () => {
    it("parses deeply nested parentheses in linear time (packrat cache)", () => {
      // Without memoization each nesting level multiplied the work ~15x and
      // this expression took minutes to parse.
      const src = "((((((((1+2)*3)+4)*5)+6)*7)+8)*9)";
      const start = performance.now();
      const ast = parse(src);
      expect(performance.now() - start).toBeLessThan(500);
      expect(ast.type).toBe("binary");
    });
  });

  describe("numbers", () => {
    it("should parse integers", () => {
      expect(parse("42")).toEqual({ type: "number", value: 42 });
    });

    it("should parse floats", () => {
      expect(parse("3.14")).toEqual({ type: "number", value: 3.14 });
    });

    it("should parse scientific notation", () => {
      expect(parse("1.5e3")).toEqual({ type: "number", value: 1500 });
      expect(parse("2E-4")).toEqual({ type: "number", value: 0.0002 });
      expect(parse("1e+2")).toEqual({ type: "number", value: 100 });
    });

    it("should parse hex numbers", () => {
      expect(parse("0xFF")).toEqual({ type: "number", value: 255 });
      expect(parse("0x1A")).toEqual({ type: "number", value: 26 });
    });

    it("should parse binary numbers", () => {
      expect(parse("0b1010")).toEqual({ type: "number", value: 10 });
      expect(parse("0b11111111")).toEqual({ type: "number", value: 255 });
    });
  });

  describe("arithmetic operations", () => {
    it("should parse addition", () => {
      expect(parse("1 + 2")).toEqual({
        type: "binary",
        op: "+",
        left: { type: "number", value: 1 },
        right: { type: "number", value: 2 },
      });
    });

    it("should parse subtraction", () => {
      expect(parse("10 - 3")).toEqual({
        type: "binary",
        op: "-",
        left: { type: "number", value: 10 },
        right: { type: "number", value: 3 },
      });
    });

    it("should parse multiplication", () => {
      expect(parse("4 * 5")).toEqual({
        type: "binary",
        op: "*",
        left: { type: "number", value: 4 },
        right: { type: "number", value: 5 },
      });
    });

    it("should parse division", () => {
      expect(parse("20 / 4")).toEqual({
        type: "binary",
        op: "/",
        left: { type: "number", value: 20 },
        right: { type: "number", value: 4 },
      });
    });

    it("should parse exponentiation", () => {
      expect(parse("2 ^ 3")).toEqual({
        type: "binary",
        op: "^",
        left: { type: "number", value: 2 },
        right: { type: "number", value: 3 },
      });
    });

    it("should parse modulo", () => {
      expect(parse("10 mod 3")).toEqual({
        type: "binary",
        op: "mod",
        left: { type: "number", value: 10 },
        right: { type: "number", value: 3 },
      });
    });
  });

  describe("operator precedence", () => {
    it("should respect multiplication over addition", () => {
      const result = parse("1 + 2 * 3");
      expect(result).toEqual({
        type: "binary",
        op: "+",
        left: { type: "number", value: 1 },
        right: {
          type: "binary",
          op: "*",
          left: { type: "number", value: 2 },
          right: { type: "number", value: 3 },
        },
      });
    });

    it("should respect exponentiation over multiplication", () => {
      const result = parse("2 * 3 ^ 2");
      expect(result).toEqual({
        type: "binary",
        op: "*",
        left: { type: "number", value: 2 },
        right: {
          type: "binary",
          op: "^",
          left: { type: "number", value: 3 },
          right: { type: "number", value: 2 },
        },
      });
    });

    it("should handle right-associative exponentiation", () => {
      const result = parse("2 ^ 3 ^ 2");
      expect(result).toEqual({
        type: "binary",
        op: "^",
        left: { type: "number", value: 2 },
        right: {
          type: "binary",
          op: "^",
          left: { type: "number", value: 3 },
          right: { type: "number", value: 2 },
        },
      });
    });
  });

  describe("parentheses", () => {
    it("should override precedence with parentheses", () => {
      const result = parse("(1 + 2) * 3");
      expect(result).toEqual({
        type: "binary",
        op: "*",
        left: {
          type: "binary",
          op: "+",
          left: { type: "number", value: 1 },
          right: { type: "number", value: 2 },
        },
        right: { type: "number", value: 3 },
      });
    });

    it("should handle nested parentheses", () => {
      const result = parse("((1 + 2))");
      expect(result).toEqual({
        type: "binary",
        op: "+",
        left: { type: "number", value: 1 },
        right: { type: "number", value: 2 },
      });
    });
  });

  describe("unary operators", () => {
    it("should parse negative numbers", () => {
      expect(parse("-5")).toEqual({
        type: "unary",
        op: "-",
        value: { type: "number", value: 5 },
      });
    });

    it("should parse positive unary", () => {
      expect(parse("+5")).toEqual({
        type: "unary",
        op: "+",
        value: { type: "number", value: 5 },
      });
    });

    it("should handle unary in expressions", () => {
      const result = parse("3 * -2");
      expect(result).toEqual({
        type: "binary",
        op: "*",
        left: { type: "number", value: 3 },
        right: {
          type: "unary",
          op: "-",
          value: { type: "number", value: 2 },
        },
      });
    });
  });

  describe("assignments", () => {
    it("should parse variable assignment", () => {
      expect(parse("x = 42")).toEqual({
        type: "assignment",
        name: "x",
        value: { type: "number", value: 42 },
      });
    });

    it("should parse assignment with expression", () => {
      expect(parse("total = 10 + 20")).toEqual({
        type: "assignment",
        name: "total",
        value: {
          type: "binary",
          op: "+",
          left: { type: "number", value: 10 },
          right: { type: "number", value: 20 },
        },
      });
    });
  });

  describe("variables", () => {
    it("should parse variable reference", () => {
      expect(parse("myVar")).toEqual({ type: "variable", name: "myVar" });
    });

    it("should parse variable in expression", () => {
      expect(parse("x + 1")).toEqual({
        type: "binary",
        op: "+",
        left: { type: "variable", name: "x" },
        right: { type: "number", value: 1 },
      });
    });
  });

  describe("comments", () => {
    it("should parse // comments", () => {
      expect(parse("// hello world")).toEqual({
        type: "comment",
        text: "hello world",
      });
    });

    it("should parse # comments", () => {
      expect(parse("# a comment")).toEqual({
        type: "comment",
        text: "a comment",
      });
    });
  });

  describe("empty lines", () => {
    it("should parse empty input", () => {
      expect(parse("")).toEqual({ type: "empty" });
    });

    it("should parse whitespace-only input", () => {
      expect(parse("   ")).toEqual({ type: "empty" });
    });
  });

  describe("complex expressions", () => {
    it("should parse multi-operator expression", () => {
      const result = parse("1 + 2 * 3 - 4 / 2");
      expect(result.type).toBe("binary");
      expect((result as { op: string }).op).toBe("-");
    });

    it("should parse expression with hex and binary", () => {
      const result = parse("0xFF + 0b1010");
      expect(result).toEqual({
        type: "binary",
        op: "+",
        left: { type: "number", value: 255 },
        right: { type: "number", value: 10 },
      });
    });
  });
});
