/** One "### Added" / "### Fixed" block of a changelog entry. */
export interface ReleaseNotesSection {
  title: string;
  items: string[];
}

export interface ReleaseNotes {
  version: string;
  date?: string;
  sections: ReleaseNotesSection[];
}

/**
 * Extract the entry for `version` from a Keep-a-Changelog markdown document.
 * Returns null when the version has no entry or the entry has no items.
 */
export function parseReleaseNotes(markdown: string, version: string): ReleaseNotes | null {
  const lines = markdown.split(/\r?\n/);
  const heading = new RegExp(`^## ${escapeRegExp(version)}(?:\\s*[—-]\\s*(.+))?\\s*$`);

  let start = -1;
  let date: string | undefined;
  for (let i = 0; i < lines.length; i++) {
    const match = heading.exec(lines[i] ?? "");
    if (match) {
      start = i + 1;
      date = match[1]?.trim() || undefined;
      break;
    }
  }
  if (start < 0) return null;

  const sections: ReleaseNotesSection[] = [];
  let current: ReleaseNotesSection | null = null;

  for (let i = start; i < lines.length; i++) {
    const line = lines[i] ?? "";
    if (line.startsWith("## ")) break;

    if (line.startsWith("### ")) {
      current = { title: line.slice(4).trim(), items: [] };
      sections.push(current);
      continue;
    }

    const item = /^- (.*)$/.exec(line);
    if (item) {
      if (!current) {
        current = { title: "", items: [] };
        sections.push(current);
      }
      current.items.push(item[1]?.trim() ?? "");
      continue;
    }

    // Wrapped continuation of the previous bullet (indented, non-empty).
    if (current && current.items.length > 0 && /^\s+\S/.test(line)) {
      const last = current.items.length - 1;
      current.items[last] = `${current.items[last]} ${line.trim()}`;
    }
  }

  const nonEmpty = sections.filter((s) => s.items.length > 0);
  if (nonEmpty.length === 0) return null;
  return { version, date, sections: nonEmpty };
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
