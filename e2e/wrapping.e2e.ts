import { test, expect, type Page, type Locator } from "@playwright/test";

import { SETTLE_MS, clearEditor, editorOf, launchIsolatedApp, type IsolatedApp } from "./helpers";

let isolated: IsolatedApp;
let page: Page;
let editor: Locator;

test.beforeAll(async () => {
  isolated = await launchIsolatedApp();
  page = isolated.page;
  editor = editorOf(page);
});

test.afterAll(async () => {
  await isolated.close();
});

test.beforeEach(async () => {
  await clearEditor(page);
});

async function tops(locator: Locator): Promise<number[]> {
  return locator.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().top));
}

/** Each result must sit as far below the first result as its line sits below the first line. */
async function expectAligned(count: number): Promise<void> {
  const lineTops = await tops(page.locator(".cm-line"));
  const resultTops = await tops(page.getByTestId("result-value"));
  // Compare offsets from the first row: the text baseline differs, the spacing must not.
  for (let i = 1; i < count; i++) {
    const lineOffset = lineTops[i]! - lineTops[0]!;
    const resultOffset = resultTops[i]! - resultTops[0]!;
    expect(Math.abs(resultOffset - lineOffset)).toBeLessThanOrEqual(1);
  }
}

test.describe("Line wrapping", () => {
  test("a long line wraps and later results stay aligned with their lines", async () => {
    const long = Array.from({ length: 40 }, (_, i) => i + 1).join(" + ");
    await editor.pressSequentially(`${long}\n2 * 3\n10 / 4`, { delay: 2 });
    await page.waitForTimeout(SETTLE_MS);

    const lines = page.locator(".cm-line");
    const firstLine = await lines.first().boundingBox();
    const secondLine = await lines.nth(1).boundingBox();
    expect(firstLine!.height).toBeGreaterThan(secondLine!.height * 1.5);

    // No horizontal scrolling: the long line wrapped instead.
    const scroller = page.locator(".cm-scroller");
    const overflow = await scroller.evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);

    await expect(page.getByTestId("result-value")).toHaveText(["820", "6", "2.5"]);
    await expectAligned(3);
  });

  test("results realign when the window is resized", async () => {
    const long = Array.from({ length: 12 }, (_, i) => i + 1).join(" + ");
    await editor.pressSequentially(`${long}\n2 * 3\n10 / 4`, { delay: 2 });
    await page.waitForTimeout(SETTLE_MS);
    await expect(page.getByTestId("result-value")).toHaveText(["78", "6", "2.5"]);

    const setWidth = (width: number) =>
      isolated.app.evaluate(({ BrowserWindow }, w) => {
        const win = BrowserWindow.getAllWindows()[0]!;
        const [, h] = win.getSize();
        win.setSize(w, h!);
      }, width);

    const lines = page.locator(".cm-line");
    await setWidth(1100);
    await page.waitForTimeout(SETTLE_MS);
    const wideHeight = (await lines.first().boundingBox())!.height;

    await setWidth(520); // above the window's 480 px minWidth
    await page.waitForTimeout(SETTLE_MS);
    expect((await lines.first().boundingBox())!.height).toBeGreaterThan(wideHeight);
    await expectAligned(3);
  });
});
