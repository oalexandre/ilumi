import { useEffect, useState } from "react";

interface WhatsNewPanelProps {
  /** Unseen versions, newest first. Null hides the panel. */
  notes: ReleaseNotes[] | null;
  onClose: () => void;
}

/** Render `code` spans from backtick-delimited markdown. */
function InlineMarkdown({ text }: { text: string }): React.JSX.Element {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <code
            key={i}
            style={{
              fontFamily: "inherit",
              background: "var(--bg-results)",
              border: "1px solid var(--border)",
              borderRadius: "3px",
              padding: "0 4px",
              fontSize: "12px",
            }}
          >
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function Entry({ entry, showVersion }: { entry: ReleaseNotes; showVersion: boolean }): React.JSX.Element {
  return (
    <div style={{ marginBottom: "18px" }}>
      {showVersion && (
        <div
          className="flex items-baseline"
          style={{ gap: "8px", marginBottom: "8px", paddingBottom: "4px", borderBottom: "1px solid var(--border)" }}
        >
          <span style={{ fontSize: "14px", fontWeight: 600 }}>{entry.version}</span>
          {entry.date && <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{entry.date}</span>}
        </div>
      )}
      {entry.sections.map((section, i) => (
        <div key={section.title || i} style={{ marginBottom: "12px" }}>
          {section.title && (
            <h3 style={{ fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "var(--accent)" }}>
              {section.title}
            </h3>
          )}
          <ul style={{ paddingLeft: "18px", listStyle: "disc" }}>
            {section.items.map((item, j) => (
              <li key={j} style={{ marginBottom: "6px", lineHeight: 1.5 }}>
                <InlineMarkdown text={item} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

const linkStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "var(--accent)",
  fontSize: "12px",
  cursor: "pointer",
  padding: 0,
};

export function WhatsNewPanel({ notes, onClose }: WhatsNewPanelProps): React.JSX.Element | null {
  const [changelog, setChangelog] = useState<ReleaseNotes[] | null>(null);

  // Start on the unseen notes each time the panel opens.
  useEffect(() => {
    setChangelog(null);
  }, [notes]);

  if (!notes || notes.length === 0) return null;

  const showingChangelog = changelog !== null;
  const entries = showingChangelog ? changelog : notes;
  const newest = notes[0]!;
  const title = showingChangelog ? "Changelog" : `What's new in Ilumi ${newest.version}`;
  const subtitle = showingChangelog
    ? "All versions"
    : notes.length > 1
      ? `${notes.length} versions since your last update`
      : newest.date;

  const openChangelog = () => {
    window.numi
      .getChangelog()
      .then((all) => setChangelog(all))
      .catch(() => {});
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 110, background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
      data-testid="whats-new"
    >
      <div
        className="rounded-lg"
        style={{
          background: "var(--bg-primary)",
          border: "1px solid var(--border)",
          width: "500px",
          maxHeight: "80vh",
          overflow: "auto",
          padding: "24px",
          fontFamily: "system-ui, sans-serif",
          fontSize: "13px",
          color: "var(--text-primary)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between" style={{ marginBottom: "16px" }}>
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: 600 }}>{title}</h2>
            {subtitle && <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{subtitle}</span>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              fontSize: "18px",
              cursor: "pointer",
              padding: "4px 8px",
            }}
          >
            ×
          </button>
        </div>

        {entries.map((entry) => (
          <Entry key={entry.version} entry={entry} showVersion={showingChangelog || entries.length > 1} />
        ))}

        <div className="flex items-center justify-between" style={{ marginTop: "4px" }}>
          {showingChangelog ? (
            <button onClick={() => setChangelog(null)} style={linkStyle}>
              ← Back to what's new
            </button>
          ) : (
            <button onClick={openChangelog} style={linkStyle} data-testid="open-changelog">
              Show full changelog
            </button>
          )}
          <button
            onClick={onClose}
            autoFocus
            style={{
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              padding: "6px 14px",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
