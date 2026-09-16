import { app } from "electron";

import changelog from "../../../changelog.md?raw";

import { parseReleaseNotes } from "./release-notes.js";
import type { ReleaseNotes } from "./release-notes.js";
import { loadSettings, saveSetting } from "./settings.js";

/** Release notes of the running version, or null when the changelog has no entry for it. */
export function getCurrentReleaseNotes(): ReleaseNotes | null {
  return parseReleaseNotes(changelog, app.getVersion());
}

/**
 * Notes to show on this launch: only after an update, never on a fresh install
 * (there is nothing "new" to a first-time user), and only once per version.
 */
export function getWhatsNew(): ReleaseNotes | null {
  const current = app.getVersion();
  const lastSeen = loadSettings().lastSeenVersion;

  if (lastSeen === current) return null;

  const notes = getCurrentReleaseNotes();
  if (!lastSeen || !notes) {
    // First launch, or nothing to show for this version: remember it and stay quiet.
    saveSetting("lastSeenVersion", current);
    return null;
  }
  return notes;
}

export function dismissWhatsNew(): void {
  saveSetting("lastSeenVersion", app.getVersion());
}
