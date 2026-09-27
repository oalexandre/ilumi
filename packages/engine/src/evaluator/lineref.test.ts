import { describe, it, expect } from "vitest";

import { evaluate } from "../index.js";

describe("line references", () => {
  describe("sum / total", () => {
    it("should return sum of all results above", () => {
      const results = evaluate("10\n20\n30\nsum");
      expect(results[3]?.value).toBe(60);
    });

    it("should work with total alias", () => {
      const results = evaluate("10\n20\ntotal");
      expect(results[2]?.value).toBe(30);
    });

    it("should skip comments and empty lines", () => {
      const results = evaluate("10\n// comment\n20\n\nsum");
      expect(results[4]?.value).toBe(30);
    });
  });

  describe("avg / average", () => {
    it("should return average of results above", () => {
      const results = evaluate("10\n20\n30\navg");
      expect(results[3]?.value).toBe(20);
    });

    it("should work with average alias", () => {
      const results = evaluate("100\n200\naverage");
      expect(results[2]?.value).toBe(150);
    });

    it("should skip empty lines", () => {
      const results = evaluate("10\n\n30\navg");
      expect(results[3]?.value).toBe(20);
    });
  });

  describe("prev / previous", () => {
    it("should return result of previous line", () => {
      const results = evaluate("42\nprev");
      expect(results[1]?.value).toBe(42);
    });

    it("should skip empty lines to find previous", () => {
      const results = evaluate("42\n\nprev");
      expect(results[2]?.value).toBe(42);
    });

    it("should work with previous alias", () => {
      const results = evaluate("100\nprevious");
      expect(results[1]?.value).toBe(100);
    });

    it("should return 0 when no previous result", () => {
      const results = evaluate("prev");
      expect(results[0]?.value).toBe(0);
    });
  });

  describe("count", () => {
    it("should return count of lines with results", () => {
      const results = evaluate("10\n20\n30\ncount");
      expect(results[3]?.value).toBe(3);
    });

    it("should skip comments and empty lines", () => {
      const results = evaluate("10\n// comment\n20\n\ncount");
      expect(results[4]?.value).toBe(2);
    });
  });

  describe("percentage variables in arithmetic", () => {
    it("should apply percent variable: price + tax where tax=10%", () => {
      const results = evaluate("price = 310\ntax = 10%\nfinal = price + tax");
      expect(results[2]?.value).toBeCloseTo(341);
    });

    it("should subtract percent variable: price - discount where discount=20%", () => {
      const results = evaluate("price = 100\ndiscount = 20%\nfinal = price - discount");
      expect(results[2]?.value).toBeCloseTo(80);
    });
  });

  describe("sum with percentages", () => {
    it("should apply percentage to running total: Price=10, Free=20%, sum=12", () => {
      const results = evaluate("Price = 10\nFree = 20%\nsum");
      expect(results[2]?.value).toBe(12);
    });

    it("should apply multiple percentages in sequence", () => {
      const results = evaluate("100\n10%\n20%\nsum");
      // 100 → +10% → 110 → +20% → 132
      expect(results[3]?.value).toBe(132);
    });

    it("should work with percentage between values", () => {
      const results = evaluate("100\n50%\n200\nsum");
      // 100 → +50% → 150 → +200 → 350
      expect(results[3]?.value).toBe(350);
    });
  });

  describe("line refs in expressions", () => {
    it("should use sum in arithmetic", () => {
      const results = evaluate("10\n20\nsum * 2");
      expect(results[2]?.value).toBe(60);
    });

    it("should use prev in assignment", () => {
      const results = evaluate("42\nx = prev + 8");
      expect(results[1]?.value).toBe(50);
    });
  });

  describe("dates", () => {
    // A date's value is a timestamp in milliseconds; counting it would swamp every total.
    it("should leave dates out of sum, avg and count", () => {
      const doc = "10\ntoday + 2 weeks\n20\n";
      expect(evaluate(`${doc}sum`)[3]?.value).toBe(30);
      expect(evaluate(`${doc}avg`)[3]?.value).toBe(15);
      expect(evaluate(`${doc}count`)[3]?.value).toBe(2);
    });

    it("should leave formatted dates out too", () => {
      const results = evaluate("5\nnow in UTC\nsum");
      expect(results[2]?.value).toBe(5);
    });

    it("should make prev skip back to the last number", () => {
      const results = evaluate("7\ntomorrow\nprev * 2");
      expect(results[2]?.value).toBe(14);
    });

    it("should still count base conversions, which are numbers", () => {
      const results = evaluate("255 in hex\nsum");
      expect(results[1]?.value).toBe(255);
    });
  });
});
