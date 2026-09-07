import { test, expect, type Page, type Locator } from "@playwright/test";

import { launchIsolatedApp, type IsolatedApp } from "./helpers";

let isolated: IsolatedApp;
let page: Page;
let editor: Locator;

const SETTLE_MS = 200;

test.beforeAll(async () => {
  isolated = await launchIsolatedApp();
  page = isolated.page;
  editor = page.locator(".cm-content");
});

test.afterAll(async () => {
  await isolated.close();
});

test.beforeEach(async () => {
  await editor.focus();
  await page.keyboard.press("Meta+a");
  await page.keyboard.press("Backspace");
  await page.waitForTimeout(SETTLE_MS);
});

async function type(text: string): Promise<void> {
  await editor.pressSequentially(text, { delay: 10 });
  await page.waitForTimeout(SETTLE_MS);
}

async function openSettings(): Promise<void> {
  await page.getByTestId("open-settings").click();
  await expect(page.getByText("Settings", { exact: true })).toBeVisible();
}

async function closeSettings(): Promise<void> {
  await page.keyboard.press("Escape");
  await page.waitForTimeout(SETTLE_MS);
}

/** The rendered value of the result on the given 0-based line. */
function resultValue(line = 0): Locator {
  return page.getByTestId("result-value").nth(line);
}

/** The <select> that sits in the settings row with the given label. */
function settingSelect(label: string): Locator {
  return page
    .locator("div", { hasText: new RegExp(`^${label}`) })
    .locator("select")
    .last();
}

test.describe("Settings", () => {
  test("gear button in the bottom-right corner opens the settings panel", async () => {
    await openSettings();
    await expect(page.getByText("Global shortcut")).toBeVisible();
    await expect(page.getByText("Number format")).toBeVisible();
    await closeSettings();
  });

  test("shows the real app version", async () => {
    const version = await isolated.app.evaluate(({ app }) => app.getVersion());
    await openSettings();
    await expect(page.getByText(version, { exact: true })).toBeVisible();
    await closeSettings();
  });

  test("number format changes the separators of results", async () => {
    await type("1234.56");
    await expect(resultValue()).toHaveText("1,234.56");

    await openSettings();
    await settingSelect("Number format").selectOption("pt-BR");
    await closeSettings();
    await expect(resultValue()).toHaveText("1.234,56");

    await openSettings();
    await settingSelect("Number format").selectOption("en-US");
    await closeSettings();
    await expect(resultValue()).toHaveText("1,234.56");
  });

  test("decimal places cap the digits shown", async () => {
    await type("10/3");
    await expect(resultValue()).toHaveText("3.3333333333");

    await openSettings();
    await settingSelect("Decimal places").selectOption("2");
    await closeSettings();
    await expect(resultValue()).toHaveText("3.33");

    await openSettings();
    await settingSelect("Decimal places").selectOption("auto");
    await closeSettings();
    await expect(resultValue()).toHaveText("3.3333333333");
  });

  test("thousands separator can be turned off", async () => {
    await type("1234567");
    await expect(resultValue()).toHaveText("1,234,567");

    await openSettings();
    const toggle = page
      .locator("div", { hasText: /^Thousands separator/ })
      .getByRole("switch")
      .last();
    await toggle.click();
    await closeSettings();
    await expect(resultValue()).toHaveText("1234567");

    await openSettings();
    await toggle.click();
    await closeSettings();
    await expect(resultValue()).toHaveText("1,234,567");
  });

  test("always on top is applied to the window", async () => {
    const isOnTop = () =>
      isolated.app.evaluate(({ BrowserWindow }) =>
        BrowserWindow.getAllWindows()[0]?.isAlwaysOnTop(),
      );
    expect(await isOnTop()).toBe(false);

    await openSettings();
    const toggle = page
      .locator("div", { hasText: /^Always on top/ })
      .getByRole("switch")
      .last();
    await toggle.click();
    await page.waitForTimeout(SETTLE_MS);
    expect(await isOnTop()).toBe(true);

    await toggle.click();
    await page.waitForTimeout(SETTLE_MS);
    expect(await isOnTop()).toBe(false);
    await closeSettings();
  });

  test("the default global shortcut is registered and can be disabled", async () => {
    const isRegistered = (accelerator: string) =>
      isolated.app.evaluate(
        ({ globalShortcut }, acc) => globalShortcut.isRegistered(acc),
        accelerator,
      );
    expect(await isRegistered("CommandOrControl+Alt+Space")).toBe(true);

    await openSettings();
    const recorder = page.getByTestId("shortcut-recorder");
    await expect(recorder).toHaveText(/Space/);
    // The "×" next to the recorder disables the shortcut.
    await recorder.locator("xpath=following-sibling::button").click();
    await page.waitForTimeout(SETTLE_MS);
    await expect(recorder).toHaveText("None");
    expect(await isRegistered("CommandOrControl+Alt+Space")).toBe(false);

    // Record a new one: click, then press the combination.
    await recorder.click();
    await expect(recorder).toHaveText("Press keys…");
    await page.keyboard.press("Control+Alt+K");
    await page.waitForTimeout(SETTLE_MS);
    await expect(recorder).toHaveText(/K$/);
    expect(await isRegistered("Control+Alt+K")).toBe(true);
    await closeSettings();
  });
});

test.describe("Variable autocomplete", () => {
  test("suggests variables defined on earlier lines", async () => {
    await type("salary = 8500");
    await page.keyboard.press("Enter");
    await type("rent = 2300");
    await page.keyboard.press("Enter");
    await type("sal");
    const popup = page.locator(".cm-tooltip-autocomplete");
    await expect(popup).toBeVisible();
    await expect(popup.locator(".cm-completionLabel").first()).toHaveText("salary");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(SETTLE_MS);
    await expect(resultValue(2)).toHaveText("8,500");
  });

  test("does not suggest a variable defined below the cursor", async () => {
    await type("budget = 10");
    await page.keyboard.press("Home");
    await page.keyboard.press("Enter");
    await page.keyboard.press("ArrowUp");
    await type("bud");
    const popup = page.locator(".cm-tooltip-autocomplete");
    const labels = await popup.locator(".cm-completionLabel").allTextContents();
    expect(labels).not.toContain("budget");
    await page.keyboard.press("Escape");
  });
});
