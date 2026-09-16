import { describe, it, expect } from "vitest";

import { createEntityRegistry, evaluate, registerPlugin, createCurrencyPlugin, Document } from "../index.js";
import { CurrencyFetcher } from "../currency/fetcher.js";

const line = (src: string, n = 0) => evaluate(src)[n];

describe("unit arithmetic", () => {
  it("converts the whole sum when 'in' follows an addition", () => {
    const r = line("2 hours + 30 minutes in minutes");
    expect(r?.value).toBeCloseTo(150);
    expect(r?.formatted).toBe("150 min");
  });

  it("adds compatible units in the unit of the left operand", () => {
    expect(line("1 km + 500 m")?.formatted).toBe("1.5 km");
    expect(line("2 hours - 30 minutes")?.formatted).toBe("1.5 hours");
  });

  it("keeps the unit when the other operand is a plain number", () => {
    expect(line("5 km + 2")?.formatted).toBe("7 km");
    expect(line("2 hours * 2")?.formatted).toBe("4 hours");
    expect(line("10 km / 2")?.formatted).toBe("5 km");
  });

  it("drops the unit when multiplying or dividing two quantities", () => {
    expect(line("10 km / 2 km")?.formatted).toBe("5");
  });

  it("rejects adding incompatible units", () => {
    expect(line("5 km + 3 hours")?.error).toMatch(/Cannot add/);
  });

  it("still applies 'in' to a parenthesised expression with a unit", () => {
    expect(line("(2 + 3) km in m")?.value).toBeCloseTo(5000);
  });
});

describe("user variables shadow line-reference keywords", () => {
  it("uses the variable named total instead of the sum of lines above", () => {
    const results = evaluate("rent = 1200\nfood = 570\ntotal = rent + food\n20% of total\ntotal - 10%");
    expect(results[3]?.value).toBeCloseTo(354);
    expect(results[4]?.value).toBeCloseTo(1593);
  });

  it("keeps the keyword when no variable of that name exists", () => {
    expect(evaluate("10\n20\ntotal")[2]?.value).toBe(30);
  });
});

describe("currency units", () => {
  it("converts between currencies with the registered plugin", () => {
    const registry = createEntityRegistry();
    registerPlugin(registry, createCurrencyPlugin(new CurrencyFetcher()));
    const doc = new Document(registry);
    const [usd, eur] = doc.update("100 usd in brl\n50 EUR in USD");
    expect(usd?.error).toBeUndefined();
    expect(usd?.value).toBeGreaterThan(300);
    expect(eur?.value).toBeGreaterThan(40);
  });
});
