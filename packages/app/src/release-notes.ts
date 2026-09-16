/** One "### Added" / "### Fixed" block of a changelog entry. */
export interface ReleaseNotesSection {
  title: string;
  items: string[];
}

export interface ReleaseNotes {
  /** Semver string, or a label such as "Unreleased". */
  version: string;
  date?: string;
  sections: ReleaseNotesSection[];
}

const ENTRY_HEADING = /^## (\S+)(?:\s*[—-]\s*(.+))?\s*$/;

/** Parse every entry of a Keep-a-Changelog document, newest first (document order). */
export function parseChangelog(markdown: string): ReleaseNotes[] {
  const entries: ReleaseNotes[] = [];
  let entry: ReleaseNotes | null = null;
  let section: ReleaseNotesSection | null = null;

  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw ?? "";

    const heading = ENTRY_HEADING.exec(line);
    if (heading) {
      entry = { version: heading[1] ?? "", date: heading[2]?.trim() || undefined, sections: [] };
      entries.push(entry);
      section = null;
      continue;
    }
    if (!entry) continue;

    if (line.startsWith("### ")) {
      section = { title: line.slice(4).trim(), items: [] };
      entry.sections.push(section);
      continue;
    }

    const item = /^- (.*)$/.exec(line);
    if (item) {
      if (!section) {
        section = { title: "", items: [] };
        entry.sections.push(section);
      }
      section.items.push(item[1]?.trim() ?? "");
      continue;
    }

    // Wrapped continuation of the previous bullet (indented, non-empty).
    if (section && section.items.length > 0 && /^\s+\S/.test(line)) {
      const last = section.items.length - 1;
      section.items[last] = `${section.items[last]} ${line.trim()}`;
    }
  }

  return entries
    .map((e) => ({ ...e, sections: e.sections.filter((s) => s.items.length > 0) }))
    .filter((e) => e.sections.length > 0);
}

/** The entry for `version`, or null when it is missing or empty. */
export function parseReleaseNotes(markdown: string, version: string): ReleaseNotes | null {
  return parseChangelog(markdown).find((e) => e.version === version) ?? null;
}

export function isSemver(version: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(version);
}

/** Numeric semver comparison: negative when a < b, positive when a > b. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}
