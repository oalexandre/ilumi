import { describe, it, expect } from "vitest";

import { evaluate } from "../index.js";

import { resolveDateLiteral, formatDate } from "./index.js";

describe("date literals", () => {
  it("should resolve today", () => {
    const date = resolveDateLiteral("today");
    const now = new Date();
    expect(date.getDate()).toBe(now.getDate());
  });

  it("should resolve tomorrow", () => {
    const date = resolveDateLiteral("tomorrow");
    const now = new Date();
    const expected = new Date(now.getTime() + 86400000);
    expect(date.getDate()).toBe(expected.getDate());
  });

  it("should resolve yesterday", () => {
    const date = resolveDateLiteral("yesterday");
    const now = new Date();
    const expected = new Date(now.getTime() - 86400000);
    expect(date.getDate()).toBe(expected.getDate());
  });

  it("should format date", () => {
    const date = new Date(2026, 2, 20); // March 20, 2026
    const formatted = formatDate(date);
    expect(formatted).toContain("Mar");
    expect(formatted).toContain("2026");
    expect(formatted).toContain("20");
  });
});

describe("date in evaluate", () => {
  it("should parse today as a timestamp", () => {
    const results = evaluate("today");
    expect(results[0]?.value).toBeGreaterThan(0);
  });

  it("should parse tomorrow", () => {
    const results = evaluate("tomorrow");
    expect(results[0]?.value).toBeGreaterThan(0);
  });
});

describe("duration units", () => {
  it("should convert hours to minutes", () => {
    const results = evaluate("2 hours to minutes");
    expect(results[0]?.value).toBeCloseTo(120);
  });

  it("should convert days to hours", () => {
    const results = evaluate("1 day to hours");
    expect(results[0]?.value).toBeCloseTo(24);
  });

  it("should convert weeks to days", () => {
    const results = evaluate("2 weeks to days");
    expect(results[0]?.value).toBeCloseTo(14);
  });
});
