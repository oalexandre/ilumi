import { useState, useCallback, useRef } from "react";

function IconButton({
  onClick,
  tooltip,
  testId,
  children,
}: {
  onClick: () => void | Promise<void>;
  tooltip: string;
  testId?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  const [tipPos, setTipPos] = useState<{ x: number; y: number; right: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  return (
    <div style={{ marginRight: "4px" }}>
      <button
        ref={btnRef}
        data-testid={testId}
        onClick={onClick}
        onMouseEnter={() => {
          const rect = btnRef.current?.getBoundingClientRect();
          if (rect)
            setTipPos({
              x: rect.left + rect.width / 2,
              y: rect.top - 6,
              right: window.innerWidth - rect.right,
            });
        }}
        onMouseLeave={() => setTipPos(null)}
        className="shrink-0 cursor-pointer"
        style={{
          background: "transparent",
          border: "1px solid var(--border)",
          borderRadius: "50%",
          color: "var(--text-muted)",
          width: "20px",
          height: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
          padding: 0,
        }}
      >
        {children}
      </button>
      {tipPos && (
        <div
          style={{
            position: "fixed",
            top: tipPos.y,
            right: tipPos.right < 80 ? 4 : undefined,
            left: tipPos.right < 80 ? undefined : tipPos.x,
            transform: tipPos.right < 80 ? "translateY(-100%)" : "translate(-50%, -100%)",
            background: "var(--bg-primary)",
            color: "var(--text-primary)",
            border: "1px solid var(--border)",
            borderRadius: "4px",
            padding: "3px 8px",
            fontSize: "11px",
            fontFamily: "system-ui, sans-serif",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 9999,
          }}
        >
          {tooltip}
        </div>
      )}
    </div>
  );
}

interface NoteTab {
  id: string;
  title: string;
}

interface TabBarProps {
  notes: NoteTab[];
  activeId: string;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onClose: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onShare: () => Promise<void>;
  onHelp: () => void;
  onSettings: () => void;
}

export function TabBar({
  notes,
  activeId,
  onSelect,
  onCreate,
  onClose,
  onRename,
  onShare,
  onHelp,
  onSettings,
}: TabBarProps): React.JSX.Element {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [copied, setCopied] = useState(false);

  const startRename = useCallback((id: string, currentTitle: string) => {
    setEditingId(id);
    setEditValue(currentTitle);
  }, []);

  const finishRename = useCallback(() => {
    if (editingId && editValue.trim()) {
      onRename(editingId, editValue.trim());
    }
    setEditingId(null);
  }, [editingId, editValue, onRename]);

  const handleClose = useCallback(
    (e: React.MouseEvent, id: string, title: string) => {
      e.stopPropagation();
      const confirmed = window.confirm(
        `Delete "${title}"?\n\nThis note and its contents will be permanently removed.`,
      );
      if (confirmed) {
        onClose(id);
      }
    },
    [onClose],
  );

  return (
    <div
      className="flex items-center gap-0.5 overflow-x-auto px-2"
      style={{
        height: "32px",
        background: "var(--bg-results)",
        borderTop: "1px solid var(--border)",
        fontSize: "12px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {notes.map((note) => (
        <div
          key={note.id}
          className="flex items-center shrink-0 cursor-pointer select-none group"
          style={{
            padding: "4px 4px 4px 10px",
            borderRadius: "4px 4px 0 0",
            background: note.id === activeId ? "var(--bg-primary)" : "transparent",
            color: note.id === activeId ? "var(--text-primary)" : "var(--text-muted)",
          }}
          onClick={() => onSelect(note.id)}
          onDoubleClick={() => startRename(note.id, note.title)}
          onAuxClick={(e) => {
            if (e.button === 1 && notes.length > 1) {
              e.preventDefault();
              handleClose(e, note.id, note.title);
            }
          }}
        >
          {editingId === note.id ? (
            <input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={finishRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") finishRename();
                if (e.key === "Escape") setEditingId(null);
              }}
              autoFocus
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "inherit",
                fontSize: "inherit",
                fontFamily: "inherit",
                width: "80px",
              }}
            />
          ) : (
            <span>{note.title}</span>
          )}
          {notes.length > 1 && (
            <button
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                fontSize: "14px",
                cursor: "pointer",
                padding: "0 4px",
                lineHeight: 1,
                marginLeft: "4px",
                borderRadius: "3px",
                opacity: note.id === activeId ? 0.6 : 0.3,
              }}
              title={`Delete "${note.title}"`}
              onClick={(e) => handleClose(e, note.id, note.title)}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.opacity = "1";
                (e.target as HTMLElement).style.color = "var(--text-error)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.opacity = note.id === activeId ? "0.6" : "0.3";
                (e.target as HTMLElement).style.color = "var(--text-muted)";
              }}
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button
        onClick={onCreate}
        className="shrink-0 cursor-pointer"
        style={{
          background: "transparent",
          border: "none",
          color: "var(--text-muted)",
          fontSize: "16px",
          padding: "2px 8px",
          lineHeight: 1,
        }}
        title="New note"
      >
        +
      </button>
      <div style={{ flex: 1 }} />
      {/* Toast notification */}
      {copied && (
        <div
          style={{
            position: "fixed",
            top: "12px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--bg-primary)",
            color: "var(--text-result)",
            border: "1px solid var(--border)",
            borderRadius: "6px",
            padding: "6px 14px",
            fontSize: "12px",
            fontFamily: "system-ui, sans-serif",
            zIndex: 9999,
            pointerEvents: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            animation: "toast-in 0.2s ease-out",
          }}
        >
          Image copied to clipboard
        </div>
      )}
      <IconButton
        onClick={async () => {
          await onShare();
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        tooltip="Share as image"
      >
        {copied ? (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-result)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        )}
      </IconButton>
      <IconButton onClick={onHelp} tooltip="Help & reference">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </IconButton>
      <IconButton onClick={onSettings} tooltip="Settings (⌘,)" testId="open-settings">
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </IconButton>
    </div>
  );
}
