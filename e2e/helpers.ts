import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import type { ElectronApplication, Locator, Page } from "@playwright/test";
import { _electron as electron } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Longer than the 50 ms evaluation debounce in use-engine.ts. */
export const SETTLE_MS = 200;

export interface IsolatedApp {
  app: ElectronApplication;
  page: Page;
  userDataDir: string;
  /** Close the app and launch it again on the same data directory. */
  relaunch: () => Promise<Page>;
  close: () => Promise<void>;
}

async function launch(userDataDir: string): Promise<{ app: ElectronApplication; page: Page }> {
  const app = await electron.launch({
    args: [resolve(__dirname, "../out/main/main.js")],
    // Temporary data so tests never touch real notes or settings; offline so no test
    // depends on (or hammers) the exchange-rate API.
    env: { ...process.env, ILUMI_USER_DATA: userDataDir, ILUMI_OFFLINE: "1" },
  });
  const page = await app.firstWindow();
  await page.waitForSelector(".cm-editor", { timeout: 10000 });
  return { app, page };
}

/** Launch the built app against a temporary data directory so tests never touch real notes. */
export async function launchIsolatedApp(): Promise<IsolatedApp> {
  const userDataDir = mkdtempSync(join(tmpdir(), "ilumi-e2e-"));
  const isolated: IsolatedApp = {
    ...(await launch(userDataDir)),
    userDataDir,
    relaunch: async () => {
      await isolated.app.close();
      Object.assign(isolated, await launch(userDataDir));
      return isolated.page;
    },
    close: async () => {
      await isolated.app.close();
      rmSync(userDataDir, { recursive: true, force: true });
    },
  };
  return isolated;
}

export function editorOf(page: Page): Locator {
  return page.locator(".cm-content");
}

/** Empty the editor and let the (empty) evaluation land before the next test types. */
export async function clearEditor(page: Page): Promise<void> {
  await editorOf(page).focus();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.press("Backspace");
  await page.waitForTimeout(SETTLE_MS);
}

/**
 * Type like a user, then wait past the debounce. The wait matters for assertions that
 * something is absent: without it they would pass before the evaluation arrives.
 */
export async function typeInEditor(page: Page, text: string): Promise<void> {
  await editorOf(page).pressSequentially(text, { delay: 10 });
  await page.waitForTimeout(SETTLE_MS);
}

interface EvalResult {
  value: number | null;
  formatted: string;
  error?: string;
}

/** Evaluate through the main process, the same IPC path the editor uses. */
export async function evalInApp(page: Page, text: string): Promise<EvalResult[]> {
  return page.evaluate(
    (input: string) =>
      (
        window as unknown as { numi: { evaluate: (t: string) => Promise<EvalResult[]> } }
      ).numi.evaluate(input),
    text,
  );
}
