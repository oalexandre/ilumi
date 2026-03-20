import { describe, it, expect } from "vitest";

import { createDefaultRegistry } from "../units/built-in.js";
import { UnitRegistry } from "../units/registry.js";

import { CurrencyFetcher } from "./fetcher.js";
import { registerCurrencyUnits } from "./units.js";

describe("currency units", () => {
  it("should register all currencies with correct phrases", () => {
    const registry = new UnitRegistry();
    const fetcher = new CurrencyFetcher();
    registerCurrencyUnits(registry, fetcher);

    expect(registry.findByPhrase("USD")).toBeDefined();
    expect(registry.findByPhrase("EUR")).toBeDefined();
    expect(registry.findByPhrase("dollar")).toBeDefined();
    expect(registry.findByPhrase("euro")).toBeDefined();
    expect(registry.findByPhrase("BRL")).toBeDefined();
  });

  it("should convert between currencies", () => {
    const registry = createDefaultRegistry();
    const fetcher = new CurrencyFetcher();
    registerCurrencyUnits(registry, fetcher);

    const usdToEur = registry.convert(100, "currency_USD", "currency_EUR");
    expect(usdToEur).toBeGreaterThan(80);
    expect(usdToEur).toBeLessThan(110);
  });

  it("should convert BRL to USD", () => {
    const registry = createDefaultRegistry();
    const fetcher = new CurrencyFetcher();
    registerCurrencyUnits(registry, fetcher);

    const result = registry.convert(100, "currency_BRL", "currency_USD");
    expect(result).toBeGreaterThan(15);
    expect(result).toBeLessThan(30);
  });

  it("should find currency by code", () => {
    const registry = new UnitRegistry();
    const fetcher = new CurrencyFetcher();
    registerCurrencyUnits(registry, fetcher);

    const usd = registry.findByPhrase("USD");
    expect(usd).toBeDefined();
    expect(usd?.format).toBe("USD");
  });
});
