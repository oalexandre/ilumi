import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { CurrencyFetcher } from "./fetcher.js";
import type { CurrencyRates } from "./fetcher.js";

const HOUR = 60 * 60 * 1000;

function okResponse(body: unknown): Response {
  return { ok: true, json: async () => body } as unknown as Response;
}

describe("CurrencyFetcher", () => {
  it("should return fallback rates when no cache", () => {
    const fetcher = new CurrencyFetcher();
    const rates = fetcher.getRates();
    expect(rates.base).toBe("USD");
    expect(rates.timestamp).toBe(0);
    expect(rates.rates["USD"]).toBe(1);
    expect(rates.rates["EUR"]).toBe(0.92);
    expect(rates.rates["BRL"]).toBe(4.97);
  });

  it("should return rate by currency code", () => {
    const fetcher = new CurrencyFetcher();
    expect(fetcher.getRate("USD")).toBe(1);
    expect(fetcher.getRate("eur")).toBe(0.92);
    expect(fetcher.getRate("UNKNOWN")).toBeUndefined();
  });

  it("should be stale without cache", () => {
    const fetcher = new CurrencyFetcher();
    expect(fetcher.isStale()).toBe(true);
  });

  it("should support 30+ currencies", () => {
    const fetcher = new CurrencyFetcher();
    const rates = fetcher.getRates();
    expect(Object.keys(rates.rates).length).toBeGreaterThanOrEqual(30);
  });

  it("reports the fallback source before anything is fetched", () => {
    expect(new CurrencyFetcher().getStatus()).toEqual({ source: "fallback", timestamp: 0 });
  });
});

describe("CurrencyFetcher.refresh", () => {
  it("replaces the rates with the fetched ones and stamps them with the current time", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ rates: { USD: 1, EUR: 0.5 } }));
    vi.stubGlobal("fetch", fetchMock);

    const fetcher = new CurrencyFetcher();
    await fetcher.refresh();

    expect(fetchMock).toHaveBeenCalledWith("https://open.er-api.com/v6/latest/USD");
    expect(fetcher.getRates()).toEqual({
      base: "USD",
      rates: { USD: 1, EUR: 0.5 },
      timestamp: 1_700_000_000_000,
    });
    expect(fetcher.getRate("eur")).toBe(0.5);
    expect(fetcher.getRate("BRL")).toBeUndefined();
    expect(fetcher.getStatus()).toEqual({ source: "cache", timestamp: 1_700_000_000_000 });
    expect(fetcher.isStale()).toBe(false);
  });

  it("keeps the fallback rates on a non-OK response", async () => {
    const json = vi.fn();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500, json }));

    const fetcher = new CurrencyFetcher();
    await fetcher.refresh();

    expect(json).not.toHaveBeenCalled();
    expect(fetcher.getRate("EUR")).toBe(0.92);
    expect(fetcher.getStatus().source).toBe("fallback");
  });

  it("ignores a payload without a rates field", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse({ result: "error" })));

    const fetcher = new CurrencyFetcher();
    await fetcher.refresh();

    expect(fetcher.getRate("EUR")).toBe(0.92);
    expect(fetcher.getStatus()).toEqual({ source: "fallback", timestamp: 0 });
  });

  it("swallows network errors and keeps the fallback rates", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    const fetcher = new CurrencyFetcher();
    await expect(fetcher.refresh()).resolves.toBeUndefined();
    expect(fetcher.getRate("EUR")).toBe(0.92);
    expect(fetcher.getStatus().source).toBe("fallback");
  });

  it("keeps previously fetched rates when a later refresh fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(okResponse({ rates: { USD: 1, EUR: 0.5 } }))
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);

    const fetcher = new CurrencyFetcher();
    await fetcher.refresh();
    await fetcher.refresh();
    await fetcher.refresh();

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetcher.getRate("EUR")).toBe(0.5);
    expect(fetcher.getStatus().source).toBe("cache");
  });
});

describe("CurrencyFetcher cache", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "ilumi-fetcher-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("writes fetched rates to the cache and a new fetcher reads them back", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse({ rates: { USD: 1, GBP: 0.7 } })));
    const cachePath = join(dir, "rates.json");

    await new CurrencyFetcher(cachePath).refresh();

    const expected: CurrencyRates = {
      base: "USD",
      rates: { USD: 1, GBP: 0.7 },
      timestamp: 1_700_000_000_000,
    };
    expect(JSON.parse(readFileSync(cachePath, "utf-8"))).toEqual(expected);

    const reloaded = new CurrencyFetcher(cachePath);
    expect(reloaded.getRates()).toEqual(expected);
    expect(reloaded.getRate("gbp")).toBe(0.7);
    expect(reloaded.getStatus()).toEqual({ source: "cache", timestamp: 1_700_000_000_000 });
  });

  it("creates missing parent directories when saving the cache", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse({ rates: { USD: 1 } })));
    const cachePath = join(dir, "nested", "deeper", "rates.json");

    await new CurrencyFetcher(cachePath).refresh();

    expect(existsSync(cachePath)).toBe(true);
    expect(JSON.parse(readFileSync(cachePath, "utf-8")).rates).toEqual({ USD: 1 });
  });

  it("ignores a corrupt cache file and falls back to built-in rates", () => {
    const cachePath = join(dir, "rates.json");
    writeFileSync(cachePath, "{ not json", "utf-8");

    const fetcher = new CurrencyFetcher(cachePath);
    expect(fetcher.getRate("EUR")).toBe(0.92);
    expect(fetcher.getStatus()).toEqual({ source: "fallback", timestamp: 0 });
  });

  it("uses the fallback when the cache file does not exist", () => {
    const fetcher = new CurrencyFetcher(join(dir, "missing.json"));
    expect(fetcher.getStatus().source).toBe("fallback");
    expect(fetcher.isStale()).toBe(true);
  });

  it("does not throw when the cache cannot be written", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse({ rates: { USD: 1, EUR: 0.4 } })));
    // A regular file used as a parent directory makes mkdir/write fail.
    const blocker = join(dir, "file");
    writeFileSync(blocker, "x", "utf-8");

    const fetcher = new CurrencyFetcher(join(blocker, "rates.json"));
    await expect(fetcher.refresh()).resolves.toBeUndefined();
    expect(fetcher.getRate("EUR")).toBe(0.4);
  });

  it("isStale compares the cached timestamp against a one-hour window", () => {
    const now = 1_700_000_000_000;
    vi.spyOn(Date, "now").mockReturnValue(now);
    const cachePath = join(dir, "rates.json");

    writeFileSync(
      cachePath,
      JSON.stringify({ base: "USD", rates: { USD: 1 }, timestamp: now - HOUR }),
    );
    expect(new CurrencyFetcher(cachePath).isStale()).toBe(false);

    writeFileSync(
      cachePath,
      JSON.stringify({ base: "USD", rates: { USD: 1 }, timestamp: now - HOUR - 1 }),
    );
    expect(new CurrencyFetcher(cachePath).isStale()).toBe(true);
  });
});

describe("CurrencyFetcher auto refresh", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("refreshes immediately when stale and then every hour until stopped", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ rates: { USD: 1, EUR: 0.9 } }));
    vi.stubGlobal("fetch", fetchMock);
    const fetcher = new CurrencyFetcher();

    fetcher.startAutoRefresh();
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetcher.getStatus()).toEqual({
      source: "cache",
      timestamp: new Date("2026-01-15T12:00:00Z").getTime(),
    });

    await vi.advanceTimersByTimeAsync(HOUR);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    fetcher.stopAutoRefresh();
    await vi.advanceTimersByTimeAsync(3 * HOUR);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("skips the initial refresh when the cached rates are fresh", async () => {
    const dir = mkdtempSync(join(tmpdir(), "ilumi-fetcher-"));
    try {
      const cachePath = join(dir, "rates.json");
      writeFileSync(
        cachePath,
        JSON.stringify({ base: "USD", rates: { USD: 1 }, timestamp: Date.now() - 60_000 }),
      );
      const fetchMock = vi.fn().mockResolvedValue(okResponse({ rates: { USD: 1 } }));
      vi.stubGlobal("fetch", fetchMock);
      const fetcher = new CurrencyFetcher(cachePath);

      fetcher.startAutoRefresh();
      await vi.advanceTimersByTimeAsync(0);
      expect(fetchMock).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(HOUR);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      fetcher.stopAutoRefresh();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("does not start a second timer when called twice", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ rates: { USD: 1 } }));
    vi.stubGlobal("fetch", fetchMock);
    const fetcher = new CurrencyFetcher();

    fetcher.startAutoRefresh();
    fetcher.startAutoRefresh();
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(1);

    await vi.advanceTimersByTimeAsync(HOUR);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    fetcher.stopAutoRefresh();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("stopAutoRefresh is a no-op when never started", () => {
    const fetcher = new CurrencyFetcher();
    expect(() => fetcher.stopAutoRefresh()).not.toThrow();
    expect(vi.getTimerCount()).toBe(0);
  });
});
