import type { UnitRegistry } from "../units/registry.js";

import type { CurrencyFetcher } from "./fetcher.js";

interface CurrencyDef {
  code: string;
  phrases: string;
  format: string;
}

const CURRENCIES: CurrencyDef[] = [
  { code: "USD", phrases: "USD, dollar, dollars, us dollar, us dollars", format: "$" },
  { code: "EUR", phrases: "EUR, euro, euros", format: "€" },
  { code: "GBP", phrases: "GBP, pound sterling, pounds sterling, british pound", format: "£" },
  { code: "JPY", phrases: "JPY, yen, japanese yen", format: "¥" },
  { code: "BRL", phrases: "BRL, real, reais, brazilian real", format: "R$" },
  { code: "CAD", phrases: "CAD, canadian dollar, canadian dollars", format: "CA$" },
  { code: "AUD", phrases: "AUD, australian dollar, australian dollars", format: "A$" },
  { code: "CHF", phrases: "CHF, swiss franc, swiss francs", format: "CHF" },
  { code: "CNY", phrases: "CNY, yuan, chinese yuan, renminbi", format: "¥" },
  { code: "INR", phrases: "INR, rupee, rupees, indian rupee", format: "₹" },
  { code: "MXN", phrases: "MXN, mexican peso, mexican pesos", format: "MX$" },
  { code: "KRW", phrases: "KRW, won, korean won", format: "₩" },
  { code: "SEK", phrases: "SEK, swedish krona, swedish kronor", format: "kr" },
  { code: "NOK", phrases: "NOK, norwegian krone, norwegian kroner", format: "kr" },
  { code: "DKK", phrases: "DKK, danish krone, danish kroner", format: "kr" },
  { code: "NZD", phrases: "NZD, new zealand dollar, nz dollar", format: "NZ$" },
  { code: "SGD", phrases: "SGD, singapore dollar", format: "S$" },
  { code: "HKD", phrases: "HKD, hong kong dollar", format: "HK$" },
  { code: "TRY", phrases: "TRY, turkish lira", format: "₺" },
  { code: "ZAR", phrases: "ZAR, south african rand, rand", format: "R" },
  { code: "RUB", phrases: "RUB, russian ruble, ruble, rubles", format: "₽" },
  { code: "PLN", phrases: "PLN, polish zloty, zloty", format: "zł" },
  { code: "THB", phrases: "THB, thai baht, baht", format: "฿" },
  { code: "TWD", phrases: "TWD, taiwan dollar, new taiwan dollar", format: "NT$" },
];

export function registerCurrencyUnits(registry: UnitRegistry, fetcher: CurrencyFetcher): void {
  for (const currency of CURRENCIES) {
    const rate = fetcher.getRate(currency.code) ?? 1;

    registry.addUnit({
      id: `currency_${currency.code}`,
      phrases: currency.phrases,
      baseUnitId: "currency_USD",
      format: currency.code,
      ratio: 1 / rate, // ratio to convert TO base (USD): 1 unit = (1/rate) USD
    });
  }
}
