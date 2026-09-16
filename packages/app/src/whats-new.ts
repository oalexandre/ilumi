import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { app } from "electron";

import changelog from "../../../changelog.md?raw";

import { compareVersions, isSemver, parseChangelog } from "./release-notes.js";
import type { ReleaseNotes } from "./release-notes.js";
import { loadSettings, saveSetting } from "./settings.js";

/**
 * Last version shipped before this panel existed. Users updating from it have no
 * `lastSeenVersion`, so everything after it is treated as unseen.
 */
const FIRST_TRACKED_VERSION = "0.2.0";

let freshInstall = false;

/**
 * Must run before anything writes to userData: a fresh install is recognised by
 * the absence of both settings and notes.
 */
export function initWhatsNew(): void {
  const userData = app.getPath("userData");
  const hasSettings = existsSync(join(userData, "settings.json"));
  const notesDir = join(userData, "notes");
  const hasNotes = existsSync(notesDir) && readdirSync(notesDir).some((f) => f.endsWith(".json"));
  freshInstall = !hasSettings && !hasNotes;
}

export function isFreshInstall(): boolean {
  return freshInstall;
}

/** Every released entry of the bundled changelog, newest first. */
export function getChangelog(): ReleaseNotes[] {
  return parseChangelog(changelog);
}

/** Release notes of the running version, as a one-element list (empty when missing). */
export function getCurrentReleaseNotes(): ReleaseNotes[] {
  const current = app.getVersion();
  return getChangelog().filter((e) => e.version === current);
}

/**
 * Entries to show on this launch, newest first: every released version newer
 * than the one the user last saw. Silent on a fresh install and once per version.
 */
export function getWhatsNew(): ReleaseNotes[] | null {
  const current = app.getVersion();
  const lastSeen = loadSettings().lastSeenVersion;

  if (lastSeen === current) return null;
  if (freshInstall || !isSemver(current)) {
    saveSetting("lastSeenVersion", current);
    return null;
  }

  const since = lastSeen && isSemver(lastSeen) ? lastSeen : FIRST_TRACKED_VERSION;
  const unseen = getChangelog().filter(
    (e) =>
      isSemver(e.version) &&
      compareVersions(e.version, since) > 0 &&
      compareVersions(e.version, current) <= 0,
  );

  if (unseen.length === 0) {
    saveSetting("lastSeenVersion", current);
    return null;
  }
  return unseen;
}

export function dismissWhatsNew(): void {
  saveSetting("lastSeenVersion", app.getVersion());
}
