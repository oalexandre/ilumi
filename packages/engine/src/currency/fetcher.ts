import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";

const API_URL = "https://open.er-api.com/v6/latest/USD";
const REFRESH_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

export interface CurrencyRates {
  base: string;
  rates: Record<string, number>;
  timestamp: number;
}

// Hardcoded fallback rates (approximate, used when no cache and offline)
const FALLBACK_RATES: CurrencyRates = {
  base: "USD",
  timestamp: 0,
  rates: {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 149.5,
    BRL: 4.97,
    CAD: 1.36,
    AUD: 1.53,
    CHF: 0.88,
    CNY: 7.24,
    INR: 83.1,
    MXN: 17.15,
    KRW: 1320,
    SEK: 10.45,
    NOK: 10.55,
    DKK: 6.87,
    NZD: 1.63,
    SGD: 1.34,
    HKD: 7.82,
    TRY: 30.2,
    ZAR: 18.6,
    RUB: 91.5,
    PLN: 4.02,
    THB: 35.2,
    TWD: 31.5,
    ARS: 350,
    CLP: 890,
    COP: 3950,
    PEN: 3.72,
    PHP: 56.2,
    IDR: 15500,
  },
};

/** Where the rates in use came from, so results can be flagged when they are not live. */
export interface CurrencyRateStatus {
  /** "fallback": built-in table, never fetched. "cache": fetched at `timestamp` (this session or earlier). */
  source: "fallback" | "cache";
  timestamp: number;
}

export class CurrencyFetcher {
  private rates: CurrencyRates | null = null;
  private cachePath: string | null = null;
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor(cachePath?: string) {
    this.cachePath = cachePath ?? null;
    this.loadCache();
  }

  getRates(): CurrencyRates {
    return this.rates ?? FALLBACK_RATES;
  }

  getStatus(): CurrencyRateStatus {
    return this.rates
      ? { source: "cache", timestamp: this.rates.timestamp }
      : { source: "fallback", timestamp: 0 };
  }

  getRate(currency: string): number | undefined {
    const rates = this.getRates();
    return rates.rates[currency.toUpperCase()];
  }

  isStale(): boolean {
    if (!this.rates) return true;
    return Date.now() - this.rates.timestamp > REFRESH_INTERVAL_MS;
  }

  async refresh(): Promise<void> {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) return;

      const data = (await response.json()) as { rates?: Record<string, number> };
      if (!data.rates) return;

      this.rates = {
        base: "USD",
        rates: data.rates,
        timestamp: Date.now(),
      };

      this.saveCache();
    } catch {
      // Offline — keep existing cache or fallback
    }
  }

  startAutoRefresh(): void {
    if (this.refreshTimer) return;
    this.refreshTimer = setInterval(() => {
      this.refresh();
    }, REFRESH_INTERVAL_MS);

    // Initial refresh if stale
    if (this.isStale()) {
      this.refresh();
    }
  }

  stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private loadCache(): void {
    if (!this.cachePath) return;
    try {
      if (existsSync(this.cachePath)) {
        const data = readFileSync(this.cachePath, "utf-8");
        this.rates = JSON.parse(data) as CurrencyRates;
      }
    } catch {
      // Invalid cache — ignore
    }
  }

  private saveCache(): void {
    if (!this.cachePath || !this.rates) return;
    try {
      const dir = dirname(this.cachePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(this.cachePath, JSON.stringify(this.rates), "utf-8");
    } catch {
      // Cannot write cache — ignore
    }
  }
}
