import { describe, it, expect } from "vitest";

import { createEntityRegistry, registerPlugin, createCurrencyPlugin, Document } from "../index.js";

import { CurrencyFetcher } from "./fetcher.js";

function docWithCurrency(): Document {
  const registry = createEntityRegistry();
  registerPlugin(registry, createCurrencyPlugin(new CurrencyFetcher()));
  return new Document(registry);
}

describe("currency rate warnings", () => {
  it("flags currency lines when the built-in fallback table is in use", () => {
    const doc = docWithCurrency();
    doc.setCurrencyRateStatus({ source: "fallback", timestamp: 0 });
    const [conv, plain, literal, viaVar] = doc.update("100 usd in brl\n1 + 1\n5 eur\nx = 10 usd\nx * 2");
    expect(conv?.warning).toMatch(/offline exchange rates/);
    expect(plain?.warning).toBeUndefined();
    expect(literal?.warning).toMatch(/offline/);
    expect(viaVar?.warning).toMatch(/offline/);
    expect(doc.update("x = 10 usd\nx * 2")[1]?.warning).toMatch(/offline/);
  });

  it("stays quiet with fresh cached rates and warns when they are a day old", () => {
    const doc = docWithCurrency();
    doc.setCurrencyRateStatus({ source: "cache", timestamp: Date.now() - 60_000 });
    expect(doc.update("100 usd in brl")[0]?.warning).toBeUndefined();

    doc.setCurrencyRateStatus({ source: "cache", timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000 });
    expect(doc.update("100 usd in brl ")[0]?.warning).toMatch(/cached on .* may be outdated/);
  });

  it("never warns without a status", () => {
    expect(docWithCurrency().update("100 usd in brl")[0]?.warning).toBeUndefined();
  });
});
