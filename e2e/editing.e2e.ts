import { test, expect, type Page } from "@playwright/test";

import {
  SETTLE_MS,
  clearEditor,
  launchIsolatedApp,
  typeInEditor,
  type IsolatedApp,
} from "./helpers";

let isolated: IsolatedApp;
let page: Page;

test.beforeAll(async () => {
  isolated = await launchIsolatedApp();
  page = isolated.page;
});

test.afterAll(async () => {
  await isolated.close();
});

test.beforeEach(async () => {
  await clearEditor(page);
});

const type = (text: string) => typeInEditor(page, text);

const lines = () => page.locator(".cm-line");

const pending = () => page.getByTestId("result-pending");
const error = () => page.getByTestId("result-error");

test.describe("Editing feedback", () => {
  test("shows a pending indicator instead of a syntax error while typing", async () => {
    await type("a=");
    await expect(pending()).toBeVisible();
    await expect(error()).toHaveCount(0);
  });

  test("shows a pending indicator for evaluation errors while typing", async () => {
    await type("sal");
    await expect(pending()).toBeVisible();
    await expect(error()).toHaveCount(0);
  });

  test("Enter on a syntax error reveals it and stays on the line", async () => {
    await type("a=");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(SETTLE_MS);
    await expect(error()).toHaveText("Syntax error");
    await expect(pending()).toHaveCount(0);
    await expect(lines()).toHaveCount(1);
  });

  test("a second Enter on the same syntax error goes through", async () => {
    await type("a=");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(SETTLE_MS);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(SETTLE_MS);
    await expect(lines()).toHaveCount(2);
    await expect(error()).toHaveText("Syntax error");
  });

  test("Enter on a valid line creates a new line without errors", async () => {
    await type("a=1");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(SETTLE_MS);
    await expect(lines()).toHaveCount(2);
    await expect(error()).toHaveCount(0);
    await expect(pending()).toHaveCount(0);
  });

  test("Enter on an evaluation error shows it but does not block", async () => {
    await type("1/0");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(SETTLE_MS);
    await expect(lines()).toHaveCount(2);
    await expect(error()).toHaveText("Division by zero");
  });

  test("leaving the line with the arrow keys reveals the error", async () => {
    await type("a=1");
    await page.keyboard.press("Enter");
    await type("b=");
    await expect(pending()).toBeVisible();
    await page.keyboard.press("ArrowUp");
    await page.waitForTimeout(SETTLE_MS);
    await expect(error()).toHaveText("Syntax error");
    await expect(pending()).toHaveCount(0);
  });

  test("typing again after a revealed error goes back to pending", async () => {
    await type("a=");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(SETTLE_MS);
    await expect(error()).toHaveText("Syntax error");
    await type("1");
    await expect(error()).toHaveCount(0);
    await expect(pending()).toHaveCount(0);
  });
});
