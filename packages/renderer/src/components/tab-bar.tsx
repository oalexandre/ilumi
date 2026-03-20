import { useState, useCallback } from "react";

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
  onHelp: () => void;
}

export function TabBar({
  notes,
  activeId,
  onSelect,
  onCreate,
  onClose,
  onRename,
  onHelp,
}: TabBarProps): React.JSX.Element {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

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
      <button
        onClick={onHelp}
        className="shrink-0 cursor-pointer"
        style={{
          background: "transparent",
          border: "1px solid var(--border)",
          borderRadius: "50%",
          color: "var(--text-muted)",
          fontSize: "12px",
          width: "20px",
          height: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
          marginRight: "4px",
        }}
        title="Help &amp; reference"
      >
        ?
      </button>
    </div>
  );
}
