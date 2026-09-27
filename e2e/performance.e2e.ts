import { test, expect, type Page } from "@playwright/test";

import { clearEditor, launchIsolatedApp, type IsolatedApp } from "./helpers";

/*
 * End-to-end responsiveness with a large note: keystroke → IPC → engine → 1000 result rows
 * → line height sync. Budgets are generous (the engine alone takes ~20 ms here); they exist
 * to catch a render or IPC path that turns quadratic, not to benchmark.
 */

let isolated: IsolatedApp;
let page: Page;

const LINES = 1000;

// Each line depends on the previous one, so editing line 1 changes the last result.
const chain = Array.from({ length: LINES }, (_, i) =>
  i === 0 ? "v0 = 1" : `v${i} = v${i - 1} + 1`,
).join("\n");

test.beforeAll(async () => {
  isolated = await launchIsolatedApp();
  page = isolated.page;
});

test.afterAll(async () => {
  await isolated.close();
});

/** Milliseconds until `condition` holds in the page, polling every animation frame. */
async function timeUntil(condition: () => boolean): Promise<number> {
  return page.evaluate(async (source) => {
    const check = new Function(`return (${source})();`) as () => boolean;
    const start = performance.now();
    while (!check()) {
      if (performance.now() - start > 10000) throw new Error("condition never held");
      await new Promise((r) => requestAnimationFrame(r));
    }
    return performance.now() - start;
  }, condition.toString());
}

const lastResult = () => page.getByTestId("result-value").last();

/** Replace the note with the 1000-line chain and wait until every result is in. */
async function pasteChain(): Promise<number> {
  await clearEditor(page);
  const start = Date.now();
  await page.keyboard.insertText(chain);
  await expect(lastResult()).toHaveText(LINES.toLocaleString("en-US"));
  return Date.now() - start;
}

/** Vertical gap between the last visible line and the last result row. */
async function lastRowGap(): Promise<number> {
  const lineTop = await page
    .locator(".cm-line")
    .last()
    .evaluate((el) => el.getBoundingClientRect().top);
  const resultTop = await lastResult().evaluate((el) => el.getBoundingClientRect().top);
  return Math.abs(resultTop - lineTop);
}

// Each test starts from a freshly pasted note, so one failure can't cascade into the next.
test.describe("Large note performance", () => {
  test("a pasted 1000-line note shows every result quickly", async () => {
    // ~1 s locally; CI runners are several times slower.
    expect(await pasteChain()).toBeLessThan(5000);
    await expect(page.getByTestId("result-value")).toHaveCount(LINES);
  });

  test("results follow the editor after a paste scrolls it to the end", async () => {
    // The editor scrolls before the results exist; the pane must catch up once they do.
    await pasteChain();
    await expect.poll(lastRowGap).toBeLessThan(6);
  });

  test("a keystroke at the top updates the last result within budget", async () => {
    await pasteChain();
    // Put the cursor right after "v0 = 1" and turn it into "v0 = 12".
    await page.keyboard.press("ControlOrMeta+Home");
    await page.keyboard.press("End");

    const pending = timeUntil(() => {
      const values = document.querySelectorAll('[data-testid="result-value"]');
      return values[values.length - 1]?.textContent === "1,011";
    });
    await page.keyboard.type("2");
    // Includes the 50 ms debounce; ~100 ms locally.
    expect(await pending).toBeLessThan(1500);
  });

  test("scrolling back to the bottom keeps results aligned with their lines", async () => {
    await pasteChain();
    await page.keyboard.press("ControlOrMeta+Home");
    await page.keyboard.press("ControlOrMeta+End");
    // Same row, give or take the baseline offset between the two panes.
    await expect.poll(lastRowGap).toBeLessThan(6);
  });
});
