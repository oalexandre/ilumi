import { describe, it, expect } from "vitest";

import { evaluate } from "../index.js";

function evalLine(input: string): { value: number | null; formatted: string; error?: string } {
  const results = evaluate(input);
  const r = results[0];
  return { value: r?.value ?? null, formatted: r?.formatted ?? "", error: r?.error };
}

describe("unit conversion syntax", () => {
  describe("number with unit", () => {
    it("should parse number with unit suffix", () => {
      const r = evalLine("5 km");
      expect(r.value).toBe(5);
      expect(r.formatted).toBe("5 km");
    });

    it("should parse decimal with unit", () => {
      const r = evalLine("3.5 kg");
      expect(r.value).toBe(3.5);
      expect(r.formatted).toBe("3.5 kg");
    });
  });

  describe("conversion with in/to/as", () => {
    it("should convert km to meters", () => {
      const r = evalLine("5 km to meters");
      expect(r.value).toBeCloseTo(5000);
      expect(r.formatted).toContain("m");
    });

    it("should convert kg to pounds", () => {
      const r = evalLine("1 kg to pounds");
      expect(r.value).toBeCloseTo(2.20462);
      expect(r.formatted).toContain("lb");
    });

    it("should convert celsius to fahrenheit", () => {
      const r = evalLine("100 celsius to fahrenheit");
      expect(r.value).toBeCloseTo(212);
      expect(r.formatted).toContain("°F");
    });

    it("should convert inches to cm", () => {
      const r = evalLine("1 inch to centimeters");
      expect(r.value).toBeCloseTo(2.54);
    });

    it("should convert GB to MB", () => {
      const r = evalLine("1 GB to MB");
      expect(r.value).toBeCloseTo(1000);
    });
  });

  describe("conversion with abbreviations", () => {
    it("should work with unit abbreviations", () => {
      const r = evalLine("5 cm to m");
      expect(r.value).toBeCloseTo(0.05);
    });
  });

  describe("unit in formatted output", () => {
    it("should show target unit in result", () => {
      const r = evalLine("100 cm to m");
      expect(r.formatted).toBe("1 m");
    });
  });

  describe("error cases", () => {
    it("should error on incompatible units", () => {
      const r = evalLine("5 km to kg");
      expect(r.error).toBeDefined();
      expect(r.error).toContain("incompatible");
    });
  });
});
