import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import type { ElectronApplication, Page } from "@playwright/test";
import { _electron as electron } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface IsolatedApp {
  app: ElectronApplication;
  page: Page;
  close: () => Promise<void>;
}

/** Launch the built app against a temporary data directory so tests never touch real notes. */
export async function launchIsolatedApp(): Promise<IsolatedApp> {
  const userDataDir = mkdtempSync(join(tmpdir(), "ilumi-e2e-"));
  const app = await electron.launch({
    args: [resolve(__dirname, "../out/main/main.js")],
    env: { ...process.env, ILUMI_USER_DATA: userDataDir },
  });
  const page = await app.firstWindow();
  await page.waitForSelector(".cm-editor", { timeout: 10000 });
  await page.waitForTimeout(500);
  return {
    app,
    page,
    close: async () => {
      await app.close();
      rmSync(userDataDir, { recursive: true, force: true });
    },
  };
}
