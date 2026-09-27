import { describe, it, expect } from "vitest";

import { evaluate, createEntityRegistry } from "../index.js";

describe("date literals", () => {
  const registry = createEntityRegistry();

  it("should resolve today", () => {
    const date = registry.resolveDateLiteral("today");
    const now = new Date();
    expect(date.getDate()).toBe(now.getDate());
  });

  it("should resolve tomorrow", () => {
    const date = registry.resolveDateLiteral("tomorrow");
    const now = new Date();
    const expected = new Date(now.getTime() + 86400000);
    expect(date.getDate()).toBe(expected.getDate());
  });

  it("should resolve yesterday", () => {
    const date = registry.resolveDateLiteral("yesterday");
    const now = new Date();
    const expected = new Date(now.getTime() - 86400000);
    expect(date.getDate()).toBe(expected.getDate());
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

describe("date arithmetic", () => {
  it("today + 1 day should produce a date-formatted result", () => {
    const results = evaluate("today + 1 day");
    expect(results[0]?.value).toBeGreaterThan(0);
    // Should be formatted as a date, not a raw number
    expect(results[0]?.formatted).toMatch(/\w{3},/);
  });

  it("today + 1 day should be ~24h after today", () => {
    const today = evaluate("today");
    const todayPlus1 = evaluate("today + 1 day");
    const diff = (todayPlus1[0]?.value ?? 0) - (today[0]?.value ?? 0);
    expect(diff).toBeCloseTo(86400000, -3); // 24h in ms
  });

  it("today + 1 month should differ from today + 1 day", () => {
    const plus1Day = evaluate("today + 1 day");
    const plus1Month = evaluate("today + 1 month");
    expect(plus1Month[0]?.value).toBeGreaterThan(plus1Day[0]?.value ?? 0);
  });

  it("today + 1 year should differ significantly", () => {
    const today = evaluate("today");
    const plus1Year = evaluate("today + 1 year");
    const diff = (plus1Year[0]?.value ?? 0) - (today[0]?.value ?? 0);
    // ~365 days in ms
    expect(diff).toBeGreaterThan(300 * 86400000);
  });

  it("tomorrow - today is one day", () => {
    const [result] = evaluate("tomorrow - today");
    expect(result?.value).toBe(1);
    expect(result?.formatted).toBe("1 days");
  });

  it("a date difference converts to other durations", () => {
    expect(evaluate("today - tomorrow")[0]?.value).toBe(-1);
    expect(evaluate("tomorrow - today in hours")[0]?.formatted).toBe("24 hr");
    expect(evaluate("tomorrow - today in minutes")[0]?.value).toBe(1440);
    expect(evaluate("(today + 2 weeks) - today in weeks")[0]?.value).toBe(2);
    expect(evaluate("(today + 3 days) - today in seconds")[0]?.value).toBe(259200);
  });

  it("a date difference works in arithmetic and variables", () => {
    const results = evaluate("trip = (today + 10 days) - today\ntrip * 2\ntrip in hours");
    expect(results.map((r) => r.value)).toEqual([10, 20, 240]);
  });

  it("differences between instants keep fractions of a day", () => {
    const [result] = evaluate("(now + 36 hours) - now");
    expect(result?.value).toBe(1.5);
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
