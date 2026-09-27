import { describe, it, expect, vi } from "vitest";

import { evaluate } from "../index.js";
import type { LineResult } from "../index.js";

import { runPluginTests } from "./plugin-test-runner.js";
import type { PluginTest } from "./types.js";

function line(
  i: number,
  value: number | null,
  formatted = value === null ? "" : String(value),
): LineResult {
  return { line: i, value, formatted };
}

/** A fake evaluator that returns fixed results, whatever the input. */
function fixed(...results: LineResult[]): (input: string) => LineResult[] {
  return () => results;
}

function runOne(test: PluginTest, evaluateFn: (input: string) => LineResult[]) {
  const [result] = runPluginTests([test], evaluateFn);
  if (!result) throw new Error("runner returned no result");
  return result;
}

describe("runPluginTests", () => {
  it("passes each test's input to the evaluator and returns one result per test", () => {
    const evaluateFn = vi.fn((input: string) => [line(0, input.length)]);
    const tests: PluginTest[] = [
      { description: "a", input: "abc", expected: 3 },
      { description: "b", input: "abcd", expected: 99 },
    ];

    const results = runPluginTests(tests, evaluateFn);

    expect(evaluateFn.mock.calls).toEqual([["abc"], ["abcd"]]);
    expect(results.map((r) => [r.test.description, r.passed])).toEqual([
      ["a", true],
      ["b", false],
    ]);
    expect(results[1]?.error).toBe("Expected 99, got 4");
  });

  it("returns an empty list for no tests", () => {
    expect(runPluginTests([], fixed())).toEqual([]);
  });

  describe("exact expectations", () => {
    it("passes on an exact match and reports the actual value", () => {
      expect(runOne({ description: "", input: "", expected: 4 }, fixed(line(0, 4, "4")))).toEqual({
        test: { description: "", input: "", expected: 4 },
        passed: true,
        actual: { value: 4, formatted: "4" },
      });
    });

    it("fails when the value differs, even by a rounding error", () => {
      const result = runOne(
        { description: "", input: "", expected: 0.3 },
        fixed(line(0, 0.1 + 0.2)),
      );
      expect(result.passed).toBe(false);
      expect(result.error).toBe("Expected 0.3, got 0.30000000000000004");
      expect(result.actual?.value).toBe(0.30000000000000004);
    });

    it("checks for null values", () => {
      expect(
        runOne({ description: "", input: "", expected: null }, fixed(line(0, null))).passed,
      ).toBe(true);
      const result = runOne({ description: "", input: "", expected: null }, fixed(line(0, 7)));
      expect(result.passed).toBe(false);
      expect(result.error).toBe("Expected null, got 7");
    });

    it("passes a test with neither expected nor formatted when the line has no error", () => {
      expect(runOne({ description: "", input: "" }, fixed(line(0, 1))).passed).toBe(true);
    });
  });

  describe("tolerance", () => {
    it("accepts values within the tolerance on either side, inclusive", () => {
      const test: PluginTest = { description: "", input: "", expected: 10, tolerance: 0.5 };
      expect(runOne(test, fixed(line(0, 10.5))).passed).toBe(true);
      expect(runOne(test, fixed(line(0, 9.5))).passed).toBe(true);
      expect(runOne(test, fixed(line(0, 10.2))).passed).toBe(true);
    });

    it("rejects values outside the tolerance with a descriptive error", () => {
      const test: PluginTest = { description: "", input: "", expected: 10, tolerance: 0.5 };
      const result = runOne(test, fixed(line(0, 10.51)));
      expect(result.passed).toBe(false);
      expect(result.error).toBe("Expected ≈10 (±0.5), got 10.51");
    });

    it("rejects a null value when a number is expected within tolerance", () => {
      const test: PluginTest = { description: "", input: "", expected: 1, tolerance: 100 };
      const result = runOne(test, fixed(line(0, null)));
      expect(result.passed).toBe(false);
      expect(result.error).toBe("Expected ≈1 (±100), got null");
    });

    it("ignores tolerance when there is no expected value", () => {
      expect(
        runOne({ description: "", input: "", tolerance: 1 }, fixed(line(0, 12345))).passed,
      ).toBe(true);
    });
  });

  describe("formatted expectations", () => {
    it("compares the formatted string after the value check", () => {
      const test: PluginTest = { description: "", input: "", expected: 255, formatted: "0xFF" };
      expect(runOne(test, fixed(line(0, 255, "0xFF"))).passed).toBe(true);

      const result = runOne(test, fixed(line(0, 255, "0xff")));
      expect(result.passed).toBe(false);
      expect(result.error).toBe('Expected formatted "0xFF", got "0xff"');
      expect(result.actual).toEqual({ value: 255, formatted: "0xff" });
    });

    it("reports the value mismatch first when both are wrong", () => {
      const test: PluginTest = { description: "", input: "", expected: 1, formatted: "one" };
      expect(runOne(test, fixed(line(0, 2, "two"))).error).toBe("Expected 1, got 2");
    });
  });

  describe("line option", () => {
    const threeLines = fixed(line(0, 10), line(1, 20), line(2, 30));

    it("defaults to the first line", () => {
      expect(runOne({ description: "", input: "", expected: 10 }, threeLines).passed).toBe(true);
    });

    it("selects a line by positive index", () => {
      expect(runOne({ description: "", input: "", line: 1, expected: 20 }, threeLines).passed).toBe(
        true,
      );
      expect(runOne({ description: "", input: "", line: 2, expected: 30 }, threeLines).passed).toBe(
        true,
      );
    });

    it("counts negative indexes from the end", () => {
      expect(
        runOne({ description: "", input: "", line: -1, expected: 30 }, threeLines).passed,
      ).toBe(true);
      expect(
        runOne({ description: "", input: "", line: -3, expected: 10 }, threeLines).passed,
      ).toBe(true);
    });

    it("fails when the line index is past the end", () => {
      const result = runOne({ description: "", input: "", line: 5, expected: 1 }, threeLines);
      expect(result).toEqual({
        test: { description: "", input: "", line: 5, expected: 1 },
        passed: false,
        error: "No result at line 5",
      });
    });

    it("fails when the evaluator returns no lines at all", () => {
      expect(runOne({ description: "", input: "" }, fixed()).error).toBe("No result at line 0");
    });

    // Used to be clamped to line 0, so a test aimed at the wrong line could silently pass.
    it("fails when a negative line index reaches before the first line", () => {
      const result = runOne({ description: "", input: "", line: -5, expected: 10 }, threeLines);
      expect(result.passed).toBe(false);
    });
  });

  describe("failure reporting", () => {
    it("reports evaluation errors on the selected line", () => {
      const evaluateFn = fixed({
        line: 0,
        value: null,
        formatted: "",
        error: 'Undefined variable "x"',
      });
      const result = runOne({ description: "uses x", input: "x", expected: 1 }, evaluateFn);
      expect(result).toEqual({
        test: { description: "uses x", input: "x", expected: 1 },
        passed: false,
        actual: { value: null, formatted: "" },
        error: 'Evaluation error: Undefined variable "x"',
      });
    });

    it("turns exceptions thrown by the evaluator into failures", () => {
      const boom = () => {
        throw new Error("kaboom");
      };
      expect(runOne({ description: "", input: "" }, boom)).toEqual({
        test: { description: "", input: "" },
        passed: false,
        error: "Exception: kaboom",
      });

      const throwsString = () => {
        throw "raw string";
      };
      expect(runOne({ description: "", input: "" }, throwsString).error).toBe(
        "Exception: raw string",
      );
    });

    it("keeps running later tests after a failure", () => {
      let calls = 0;
      const flaky = (): LineResult[] => {
        calls++;
        if (calls === 1) throw new Error("first fails");
        return [line(0, 2)];
      };
      const results = runPluginTests(
        [
          { description: "one", input: "1" },
          { description: "two", input: "2", expected: 2 },
        ],
        flaky,
      );
      expect(results.map((r) => r.passed)).toEqual([false, true]);
    });
  });

  describe("with the real engine", () => {
    it("runs multi-line tests against evaluate()", () => {
      const results = runPluginTests(
        [
          {
            description: "sum",
            input: "a = 2\nb = 3\na * b",
            line: -1,
            expected: 6,
            formatted: "6",
          },
          { description: "pi", input: "pi", expected: 3.14159, tolerance: 1e-5 },
          { description: "wrong", input: "1 + 1", expected: 3 },
          { description: "error", input: "nope + 1", expected: 1 },
        ],
        evaluate,
      );

      expect(results.map((r) => r.passed)).toEqual([true, true, false, false]);
      expect(results[2]?.error).toBe("Expected 3, got 2");
      expect(results[3]?.error).toBe('Evaluation error: Undefined variable "nope"');
    });
  });
});
