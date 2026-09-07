import { useState, useCallback } from "react";

const IS_MAC = navigator.platform.toUpperCase().includes("MAC");

/** Keys that Electron accelerators name differently from KeyboardEvent.code. */
const CODE_TO_KEY: Record<string, string> = {
  Space: "Space",
  Enter: "Return",
  NumpadEnter: "Return",
  Backspace: "Backspace",
  Delete: "Delete",
  Tab: "Tab",
  ArrowUp: "Up",
  ArrowDown: "Down",
  ArrowLeft: "Left",
  ArrowRight: "Right",
  Home: "Home",
  End: "End",
  PageUp: "PageUp",
  PageDown: "PageDown",
  Insert: "Insert",
  Minus: "-",
  Equal: "=",
  Comma: ",",
  Period: ".",
  Slash: "/",
  Backslash: "\\",
  Semicolon: ";",
  Quote: "'",
  BracketLeft: "[",
  BracketRight: "]",
  Backquote: "`",
};

/** Build an Electron accelerator from a key event, or null if it can't be a global shortcut. */
function acceleratorFromEvent(e: KeyboardEvent | React.KeyboardEvent): string | null {
  const modifiers: string[] = [];
  if (e.metaKey) modifiers.push(IS_MAC ? "Command" : "Super");
  if (e.ctrlKey) modifiers.push("Control");
  if (e.altKey) modifiers.push("Alt");
  if (e.shiftKey) modifiers.push("Shift");

  // A global shortcut needs at least one modifier other than Shift.
  if (!e.metaKey && !e.ctrlKey && !e.altKey) return null;

  const code = e.code;
  let key: string | null = null;
  if (code in CODE_TO_KEY) key = CODE_TO_KEY[code] ?? null;
  else if (/^Key[A-Z]$/.test(code)) key = code.slice(3);
  else if (/^Digit[0-9]$/.test(code)) key = code.slice(5);
  else if (/^Numpad[0-9]$/.test(code)) key = `num${code.slice(6)}`;
  else if (/^F([1-9]|1[0-9]|2[0-4])$/.test(code)) key = code;
  if (!key) return null;

  return [...modifiers, key].join("+");
}

/** Human-readable form of an accelerator, with symbols on macOS. */
export function describeAccelerator(accelerator: string): string {
  if (!accelerator) return "None";
  return accelerator
    .split("+")
    .map((part) => {
      switch (part) {
        case "CommandOrControl":
        case "CmdOrCtrl":
          return IS_MAC ? "⌘" : "Ctrl";
        case "Command":
        case "Cmd":
          return IS_MAC ? "⌘" : "Win";
        case "Super":
          return IS_MAC ? "⌘" : "Win";
        case "Control":
        case "Ctrl":
          return IS_MAC ? "⌃" : "Ctrl";
        case "Alt":
        case "Option":
          return IS_MAC ? "⌥" : "Alt";
        case "Shift":
          return IS_MAC ? "⇧" : "Shift";
        case "Return":
          return "↩";
        default:
          return part;
      }
    })
    .join(IS_MAC ? "" : "+");
}

interface ShortcutRecorderProps {
  value: string;
  onChange: (accelerator: string) => void;
}

/**
 * A button that, when focused, records the next key combination as an Electron accelerator.
 * Escape cancels; the "×" clears the shortcut.
 */
export function ShortcutRecorder({ value, onChange }: ShortcutRecorderProps): React.JSX.Element {
  const [recording, setRecording] = useState(false);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (!recording) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "Escape") {
        setRecording(false);
        return;
      }
      // Ignore modifier-only presses until a real key arrives.
      if (["Meta", "Control", "Alt", "Shift"].includes(e.key)) return;
      const accelerator = acceleratorFromEvent(e);
      if (!accelerator) return;
      setRecording(false);
      onChange(accelerator);
    },
    [recording, onChange],
  );

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
      <button
        type="button"
        data-testid="shortcut-recorder"
        onClick={() => setRecording(true)}
        onBlur={() => setRecording(false)}
        onKeyDown={handleKeyDown}
        title="Click, then press the new shortcut"
        style={{
          minWidth: "120px",
          padding: "4px 10px",
          fontSize: "13px",
          fontFamily: "system-ui, sans-serif",
          borderRadius: "4px",
          cursor: "pointer",
          color: recording ? "var(--accent)" : "var(--text-primary)",
          background: "var(--bg-results)",
          border: `1px solid ${recording ? "var(--accent)" : "var(--border)"}`,
        }}
      >
        {recording ? "Press keys…" : describeAccelerator(value)}
      </button>
      <button
        type="button"
        onClick={() => onChange("")}
        title="Disable the global shortcut"
        disabled={!value}
        style={{
          background: "transparent",
          border: "none",
          color: "var(--text-muted)",
          fontSize: "16px",
          cursor: value ? "pointer" : "default",
          opacity: value ? 1 : 0.3,
          padding: "0 4px",
        }}
      >
        ×
      </button>
    </div>
  );
}
