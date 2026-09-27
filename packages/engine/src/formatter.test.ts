import { describe, it, expect } from "vitest";

import { formatDate, formatNumber, formatWithUnit } from "./formatter.js";

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

describe("formatNumber options", () => {
  it("uses the locale separators", () => {
    expect(formatNumber(1234.56, { locale: "pt-BR" })).toBe("1.234,56");
    expect(formatNumber(1234.56, { locale: "fr-FR" })).toBe("1\u202f234,56");
  });

  it("caps decimals at maxDecimals without padding", () => {
    expect(formatNumber(3.14159, { maxDecimals: 2 })).toBe("3.14");
    expect(formatNumber(2.5, { maxDecimals: 2 })).toBe("2.5");
    expect(formatNumber(1 / 3, { maxDecimals: 0 })).toBe("0");
  });

  it("can disable thousands grouping", () => {
    expect(formatNumber(1234567, { useGrouping: false })).toBe("1234567");
  });

  it("passes options through formatWithUnit", () => {
    expect(formatWithUnit(1234.5, "km", { locale: "pt-BR" })).toBe("1.234,5 km");
  });
});

describe("formatNumber maxDecimals clamping", () => {
  it("treats a negative maxDecimals as 0", () => {
    expect(formatNumber(3.7, { maxDecimals: -3 })).toBe("4");
    expect(formatNumber(1234.5, { maxDecimals: -1 })).toBe("1,235");
  });

  it("never shows more than 10 decimals even when asked for more", () => {
    expect(formatNumber(0.123456789012, { maxDecimals: 20 })).toBe("0.123456789");
    expect(formatNumber(1 / 3, { maxDecimals: 50 })).toBe("0.3333333333");
    expect(formatNumber(1 / 3)).toBe("0.3333333333");
  });

  it("does not pad when maxDecimals exceeds what the value needs", () => {
    expect(formatNumber(1.5, { maxDecimals: 8 })).toBe("1.5");
    expect(formatNumber(7, { maxDecimals: 10 })).toBe("7");
  });

  it("formats non-finite values regardless of options", () => {
    expect(formatNumber(NaN, { maxDecimals: 2, locale: "pt-BR" })).toBe("NaN");
    expect(formatNumber(-Infinity, { maxDecimals: -1 })).toBe("-Infinity");
  });

  it("drops an empty unit", () => {
    expect(formatWithUnit(42, "")).toBe("42");
  });
});

describe("formatDate", () => {
  it("formats a local date as weekday, month, day and year in en-US", () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe("Mon, Jan 5, 2026");
    expect(formatDate(new Date(2026, 6, 4, 23, 59))).toBe("Sat, Jul 4, 2026");
    expect(formatDate(new Date(2024, 1, 29))).toBe("Thu, Feb 29, 2024");
  });

  it("ignores the time of day", () => {
    expect(formatDate(new Date(2026, 8, 27, 0, 0))).toBe(formatDate(new Date(2026, 8, 27, 23, 59)));
  });
});
