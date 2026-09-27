import { describe, it, expect } from "vitest";

import { evaluate } from "../index.js";

function evalLine(input: string): number | null {
  const results = evaluate(input);
  if (results[0]?.error) {
    throw new Error(results[0].error);
  }
  return results[0]?.value ?? null;
}

describe("math functions", () => {
  describe("basic functions", () => {
    it("should evaluate sqrt", () => {
      expect(evalLine("sqrt(16)")).toBe(4);
      expect(evalLine("sqrt(2)")).toBeCloseTo(1.4142, 4);
    });

    it("should evaluate cbrt", () => {
      expect(evalLine("cbrt(27)")).toBe(3);
    });

    it("should evaluate abs", () => {
      expect(evalLine("abs(-5)")).toBe(5);
      expect(evalLine("abs(5)")).toBe(5);
    });

    it("should evaluate ceil", () => {
      expect(evalLine("ceil(4.1)")).toBe(5);
      expect(evalLine("ceil(-4.1)")).toBe(-4);
    });

    it("should evaluate floor", () => {
      expect(evalLine("floor(4.9)")).toBe(4);
      expect(evalLine("floor(-4.1)")).toBe(-5);
    });

    it("should evaluate round", () => {
      expect(evalLine("round(4.5)")).toBe(5);
      expect(evalLine("round(4.4)")).toBe(4);
    });

    it("should round to the given decimal places", () => {
      expect(evalLine("round(10 / 3, 2)")).toBe(3.33);
      expect(evalLine("round(1.005, 2)")).toBe(1.01);
      expect(evalLine("round(2.5, 0)")).toBe(3);
      expect(evalLine("round(1234.5678, -2)")).toBe(1200);
      expect(evalLine("round(-1.234, 1)")).toBe(-1.2);
    });

    it("should evaluate trunc", () => {
      expect(evalLine("trunc(4.9)")).toBe(4);
      expect(evalLine("trunc(-4.9)")).toBe(-4);
    });

    it("should evaluate sign", () => {
      expect(evalLine("sign(-5)")).toBe(-1);
      expect(evalLine("sign(5)")).toBe(1);
      expect(evalLine("sign(0)")).toBe(0);
    });

    it("should evaluate exp", () => {
      expect(evalLine("exp(0)")).toBe(1);
      expect(evalLine("exp(1)")).toBeCloseTo(Math.E);
    });
  });

  describe("trigonometric functions", () => {
    it("should evaluate sin", () => {
      expect(evalLine("sin(0)")).toBe(0);
      expect(evalLine("sin(pi / 2)")).toBeCloseTo(1);
    });

    it("should evaluate cos", () => {
      expect(evalLine("cos(0)")).toBe(1);
      expect(evalLine("cos(pi)")).toBeCloseTo(-1);
    });

    it("should evaluate tan", () => {
      expect(evalLine("tan(0)")).toBe(0);
    });

    it("should evaluate asin", () => {
      expect(evalLine("asin(1)")).toBeCloseTo(Math.PI / 2);
    });

    it("should evaluate acos", () => {
      expect(evalLine("acos(1)")).toBeCloseTo(0);
    });

    it("should evaluate atan", () => {
      expect(evalLine("atan(1)")).toBeCloseTo(Math.PI / 4);
    });
  });

  describe("logarithmic functions", () => {
    it("should evaluate log (base 10)", () => {
      expect(evalLine("log(100)")).toBeCloseTo(2);
      expect(evalLine("log10(1000)")).toBeCloseTo(3);
    });

    it("should evaluate ln (natural log)", () => {
      expect(evalLine("ln(e)")).toBeCloseTo(1);
    });

    it("should evaluate log2", () => {
      expect(evalLine("log2(8)")).toBeCloseTo(3);
    });
  });

  describe("multi-arg functions", () => {
    it("should evaluate min", () => {
      expect(evalLine("min(3, 1, 2)")).toBe(1);
    });

    it("should evaluate max", () => {
      expect(evalLine("max(3, 1, 2)")).toBe(3);
    });
  });

  describe("syntax variants", () => {
    it("should support parenthesized syntax", () => {
      expect(evalLine("sqrt(25)")).toBe(5);
    });

    it("should support space syntax (no parens)", () => {
      expect(evalLine("sqrt 25")).toBe(5);
    });

    it("should support space syntax with expression in parens", () => {
      expect(evalLine("sqrt (9 + 16)")).toBe(5);
    });

    it("should support nested function calls", () => {
      expect(evalLine("abs(floor(-4.7))")).toBe(5);
    });

    it("should support functions in expressions", () => {
      expect(evalLine("sqrt(16) + sqrt(9)")).toBe(7);
    });
  });

  describe("constants", () => {
    it("should provide pi", () => {
      expect(evalLine("pi")).toBeCloseTo(Math.PI);
    });

    it("should provide e", () => {
      expect(evalLine("e")).toBeCloseTo(Math.E);
    });

    it("should provide tau", () => {
      expect(evalLine("tau")).toBeCloseTo(Math.PI * 2);
    });

    it("should use constants in expressions", () => {
      expect(evalLine("2 * pi")).toBeCloseTo(Math.PI * 2);
    });
  });
});
