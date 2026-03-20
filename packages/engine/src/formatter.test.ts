import { describe, it, expect } from "vitest";

import { formatNumber, formatWithUnit } from "./formatter.js";

describe("formatNumber", () => {
  it("should format integers", () => {
    expect(formatNumber(42)).toBe("42");
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(-5)).toBe("-5");
  });

  it("should add thousand separators", () => {
    expect(formatNumber(1000)).toBe("1,000");
    expect(formatNumber(1000000)).toBe("1,000,000");
    expect(formatNumber(-50000)).toBe("-50,000");
  });

  it("should handle decimals with smart precision", () => {
    expect(formatNumber(3.14)).toBe("3.14");
    expect(formatNumber(1.5)).toBe("1.5");
    expect(formatNumber(100.0)).toBe("100");
  });

  it("should trim trailing zeros", () => {
    expect(formatNumber(1.1)).toBe("1.1");
    expect(formatNumber(2.5)).toBe("2.5");
  });

  it("should handle special values", () => {
    expect(formatNumber(Infinity)).toBe("Infinity");
    expect(formatNumber(-Infinity)).toBe("-Infinity");
    expect(formatNumber(NaN)).toBe("NaN");
  });

  it("should handle very small decimals", () => {
    expect(formatNumber(0.001)).toBe("0.001");
    expect(formatNumber(0.0001)).toBe("0.0001");
  });
});

describe("formatWithUnit", () => {
  it("should append unit", () => {
    expect(formatWithUnit(5, "kg")).toBe("5 kg");
    expect(formatWithUnit(100, "cm")).toBe("100 cm");
  });

  it("should handle undefined unit", () => {
    expect(formatWithUnit(42, undefined)).toBe("42");
  });

  it("should format number with thousand separators and unit", () => {
    expect(formatWithUnit(1500, "m")).toBe("1,500 m");
  });
});
