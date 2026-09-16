interface WhatsNewPanelProps {
  notes: ReleaseNotes | null;
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

export function WhatsNewPanel({ notes, onClose }: WhatsNewPanelProps): React.JSX.Element | null {
  if (!notes) return null;

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
          width: "480px",
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
            <h2 style={{ fontSize: "16px", fontWeight: 600 }}>
              What's new in Ilumi {notes.version}
            </h2>
            {notes.date && (
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{notes.date}</span>
            )}
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

        {notes.sections.map((section, i) => (
          <div key={section.title || i} style={{ marginBottom: "14px" }}>
            {section.title && (
              <h3
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "6px",
                  color: "var(--accent)",
                }}
              >
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

        <div className="flex justify-end" style={{ marginTop: "8px" }}>
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
