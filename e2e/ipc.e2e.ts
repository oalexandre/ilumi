import { test, expect, type Page } from "@playwright/test";

import { launchIsolatedApp, type IsolatedApp } from "./helpers";

/*
 * Evaluation through the running app: renderer → preload → IPC → main-process Document with
 * the plugins the app registers. The engine itself is unit-tested in packages/engine; these
 * cases check that every feature is wired into the app, one category per test, each category
 * in a single round trip.
 */

interface Case {
  input: string;
  /** 0-based line to check; defaults to the last line. */
  line?: number;
  value?: number | null;
  /** [expected, tolerance] */
  close?: [number, number];
  formatted?: string | RegExp;
  /** Substring of the expected error. */
  error?: string;
  /** Value must be greater than this. */
  above?: number;
}

const CATEGORIES: Record<string, Case[]> = {
  arithmetic: [
    { input: "1 + 1", value: 2, formatted: "2" },
    { input: "6 * 7", value: 42 },
    { input: "100 / 4", value: 25 },
    { input: "2 ^ 10", value: 1024 },
    { input: "10 mod 3", value: 1 },
    { input: "1 + 2 * 3", value: 7 },
    { input: "(1 + 2) * 3", value: 9 },
    { input: "0xFF", value: 255 },
    { input: "0b1010", value: 10 },
    { input: "1.5e3", value: 1500 },
    { input: "1000000", formatted: "1,000,000" },
  ],
  variables: [
    { input: "x = 1\ny = 2\nx + y", line: 0, value: 1 },
    { input: "x = 1\ny = 2\nx + y", line: 1, value: 2 },
    { input: "x = 1\ny = 2\nx + y", value: 3 },
    { input: "price = 100\ntax = 8\nprice + tax", value: 108 },
  ],
  percentages: [
    { input: "5%", close: [0.05, 1e-9] },
    { input: "100 + 5%", value: 105 },
    { input: "100 - 10%", value: 90 },
    { input: "5% of 200", value: 10 },
    { input: "10% off 50", value: 45 },
    { input: "10% on 50", value: 55 },
  ],
  functions: [
    { input: "sqrt(16)", value: 4, formatted: "4" },
    { input: "sqrt 9", value: 3 },
    { input: "cbrt(27)", value: 3 },
    { input: "abs(-5)", value: 5 },
    { input: "abs(-42)", value: 42 },
    { input: "ceil(4.1)", value: 5 },
    { input: "floor(4.9)", value: 4 },
    { input: "round(4.5)", value: 5 },
    { input: "round(10 / 3, 2)", value: 3.33 },
    { input: "trunc(4.9)", value: 4 },
    { input: "sin(0)", value: 0 },
    { input: "cos(0)", value: 1 },
    { input: "log10(100)", close: [2, 1e-4] },
    { input: "log2(8)", close: [3, 1e-4] },
    { input: "min(3, 1, 2)", value: 1 },
    { input: "min(5, 2, 8)", value: 2 },
    { input: "max(5, 2, 8)", value: 8 },
  ],
  constants: [
    { input: "pi", close: [3.14159, 1e-4], formatted: /^3\.14159/ },
    { input: "e", close: [2.71828, 1e-3] },
    { input: "tau", close: [6.28318, 1e-3] },
  ],
  units: [
    { input: "1 km to m", value: 1000, formatted: "1,000 m" },
    { input: "1 mile to km", close: [1.609, 1e-3] },
    { input: "1 inch to cm", close: [2.54, 0.01] },
    { input: "1 kg to pounds", close: [2.205, 0.01] },
    { input: "1 kg to lb", close: [2.205, 0.01] },
    { input: "1 kg to g", value: 1000 },
    { input: "1 gal to L", close: [3.785, 0.01] },
    { input: "0 celsius to fahrenheit", value: 32 },
    { input: "100 celsius to fahrenheit", value: 212 },
    { input: "0 celsius to kelvin", close: [273.15, 0.01] },
    { input: "1 acre to ha", close: [0.405, 1e-3] },
    { input: "1 byte to bits", value: 8 },
    { input: "1 GB to MB", value: 1000 },
    { input: "1 GiB to MiB", value: 1024 },
    { input: "32 px to rem", value: 2, formatted: "2 rem" },
    { input: "16 px to pt", value: 12 },
    { input: "2 hours to minutes", value: 120 },
    { input: "1 day to hours", value: 24 },
    { input: "2 weeks to days", value: 14 },
  ],
  "number bases": [
    { input: "255 in hex", value: 255, formatted: "0xFF" },
    { input: "255 in hexadecimal", formatted: "0xFF" },
    { input: "200 + 55 in hex", formatted: "0xFF" },
    { input: "10 in binary", formatted: "0b1010" },
    { input: "10 in bin", formatted: "0b1010" },
    { input: "8 in octal", formatted: "0o10" },
    { input: "8 in oct", formatted: "0o10" },
    { input: "0xFF in decimal", formatted: "255" },
    { input: "0xFF in dec", formatted: "255" },
    { input: "0xFF AND 0x0F", value: 15 },
    { input: "0xF0 OR 0x0F", value: 255 },
    { input: "1 << 4", value: 16 },
  ],
  "line references": [
    { input: "10\n20\n30\nsum", value: 60 },
    { input: "10\n20\nsum", value: 30, formatted: "30" },
    { input: "10\n20\ntotal", value: 30 },
    { input: "10\n20\n30\navg", value: 20 },
    { input: "100\n200\naverage", value: 150 },
    { input: "42\nprev", value: 42 },
    { input: "99\nprevious", value: 99 },
    { input: "10\n20\n30\ncount", value: 3 },
    { input: "10\n// skip\n20\ncount", value: 2 },
    { input: "10\ntoday\n20\nsum", value: 30 },
    {
      input: "price = 100\ndiscount = 10% off price\ntax = 8\ndiscount + tax\nsum",
      line: 1,
      value: 90,
    },
    { input: "price = 100\ndiscount = 10% off price\ntax = 8\ndiscount + tax\nsum", value: 296 },
  ],
  dates: [
    { input: "today", above: 0, formatted: /^\w{3}, \w{3} \d{1,2}, \d{4}$/ },
    { input: "now", above: 0 },
    // Differences of dates are durations in days.
    { input: "tomorrow - today", value: 1, formatted: "1 days" },
    { input: "today - yesterday", value: 1 },
    { input: "tomorrow - today in hours", value: 24 },
  ],
  "empty lines and errors": [
    { input: "// this is a comment", value: null },
    { input: "", value: null },
    { input: "10 / 0", value: null, error: "Division by zero" },
    { input: "unknownVar + 1", error: "Undefined variable" },
  ],
};

let isolated: IsolatedApp;
let page: Page;

test.beforeAll(async () => {
  isolated = await launchIsolatedApp();
  page = isolated.page;
});

test.afterAll(async () => {
  await isolated.close();
});

test("the window opens with the editor", async () => {
  expect(await page.title()).toBe("Ilumi Calculator");
  await expect(page.locator(".cm-editor")).toBeVisible();
});

test.describe("Evaluation through IPC", () => {
  for (const [category, cases] of Object.entries(CATEGORIES)) {
    test(category, async () => {
      const inputs = [...new Set(cases.map((c) => c.input))];
      const evaluated = await page.evaluate(async (sources) => {
        const numi = (
          window as unknown as {
            numi: {
              evaluate: (
                t: string,
              ) => Promise<Array<{ value: number | null; formatted: string; error?: string }>>;
            };
          }
        ).numi;
        const out = [];
        for (const source of sources) out.push(await numi.evaluate(source));
        return out;
      }, inputs);

      for (const c of cases) {
        const results = evaluated[inputs.indexOf(c.input)]!;
        const r = results[c.line ?? results.length - 1];
        const label = JSON.stringify(c.input);
        if (c.error === undefined) expect.soft(r?.error, label).toBeUndefined();
        else expect.soft(r?.error, label).toContain(c.error);
        if (c.value !== undefined) expect.soft(r?.value, label).toBe(c.value);
        if (c.close) {
          expect
            .soft(Math.abs((r?.value ?? NaN) - c.close[0]), label)
            .toBeLessThanOrEqual(c.close[1]);
        }
        if (c.above !== undefined) expect.soft(r?.value, label).toBeGreaterThan(c.above);
        if (typeof c.formatted === "string") expect.soft(r?.formatted, label).toBe(c.formatted);
        else if (c.formatted) expect.soft(r?.formatted, label).toMatch(c.formatted);
      }
    });
  }
});

test("a recreated window works like the first one", async () => {
  // macOS re-creates the window from the Dock ("activate") after it was destroyed. IPC
  // handlers used to be registered per window, so the second registration threw.
  const { app } = isolated;
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.destroy());
  const reopened = app.waitForEvent("window");
  await app.evaluate(({ app: electronApp }) => electronApp.emit("activate"));
  page = await reopened;
  await page.waitForSelector(".cm-editor");

  const results = await page.evaluate(() =>
    (
      window as unknown as { numi: { evaluate: (t: string) => Promise<Array<{ value: number }>> } }
    ).numi.evaluate("6 * 7"),
  );
  expect(results[0]?.value).toBe(42);
});
