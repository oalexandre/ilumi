import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { test, expect, type Page } from "@playwright/test";

import { clearEditor, launchIsolatedApp, typeInEditor, type IsolatedApp } from "./helpers";

/*
 * Notes autosave one second after the last keystroke. These tests act inside that window,
 * then read what actually reached the disk.
 */

// Longer than the 1 s autosave delay in use-notes.ts.
const AUTOSAVE_WAIT_MS = 1500;

let isolated: IsolatedApp;
let page: Page;

test.beforeEach(async () => {
  isolated = await launchIsolatedApp();
  page = isolated.page;
  await clearEditor(page);
});

test.afterEach(async () => {
  await isolated.close();
});

function savedNotes(): Array<{ id: string; title: string; content: string }> {
  const dir = join(isolated.userDataDir, "notes");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(dir, f), "utf-8")));
}

/** Create a note and wait for its (empty) editor to replace the previous one. */
async function openNewNote(): Promise<void> {
  const tabs = page.getByTitle(/^Delete "/);
  const count = await tabs.count();
  await page.getByTitle("New note").click();
  // Delete buttons only appear once there is more than one note, so just wait for a change.
  await expect(tabs).not.toHaveCount(count);
  await expect(page.locator(".cm-content")).toHaveText("");
}

test.describe("Note autosave", () => {
  test("switching notes right after typing keeps the first note's edit", async () => {
    await typeInEditor(page, "first = 111");
    // Well inside the autosave delay: this used to cancel the first note's pending save.
    await openNewNote();
    await typeInEditor(page, "second = 222");
    await page.waitForTimeout(AUTOSAVE_WAIT_MS);

    const contents = savedNotes().map((n) => n.content);
    expect(contents).toContain("first = 111");
    expect(contents).toContain("second = 222");
  });

  test("closing a note right after typing does not bring it back", async () => {
    await openNewNote();
    await typeInEditor(page, "doomed = 1");
    const before = savedNotes().length;

    page.once("dialog", (dialog) => void dialog.accept());
    await page
      .getByTitle(/^Delete "/)
      .last()
      .click();
    await page.waitForTimeout(AUTOSAVE_WAIT_MS);

    const notes = savedNotes();
    expect(notes).toHaveLength(before - 1);
    expect(notes.map((n) => n.content)).not.toContain("doomed = 1");
  });

  test("edits still pending when the app quits are saved", async () => {
    await typeInEditor(page, "unsaved = 5");
    // Quit before the autosave timer fires.
    await isolated.relaunch();
    expect(savedNotes().map((n) => n.content)).toContain("unsaved = 5");
  });
});
