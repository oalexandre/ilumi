import { useState, useCallback, useRef } from "react";
import type { LineResult } from "@engine/index";

/** Small "offline" badge shown before a value computed from non-live data; hover explains why. */
function WarningBadge({ message }: { message: string }): React.JSX.Element {
  const [tipPos, setTipPos] = useState<{ y: number; right: number } | null>(null);
  const ref = useRef<HTMLSpanElement>(null);

  return (
    <span
      ref={ref}
      data-testid="result-warning"
      aria-label={message}
      onMouseEnter={() => {
        const rect = ref.current?.getBoundingClientRect();
        if (rect) setTipPos({ y: rect.top - 6, right: window.innerWidth - rect.right });
      }}
      onMouseLeave={() => setTipPos(null)}
      onClick={(e) => e.stopPropagation()}
      style={{
        display: "inline-flex",
        alignItems: "center",
        verticalAlign: "middle",
        marginRight: "6px",
        color: "var(--text-warning)",
        cursor: "help",
      }}
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22.61 16.95A5 5 0 0 0 18 10h-1.26a8 8 0 0 0-7.05-6M5 5a8 8 0 0 0 4 15h9a5 5 0 0 0 1.7-.3" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
      {tipPos && (
        <span
          style={{
            position: "fixed",
            top: tipPos.y,
            right: tipPos.right,
            transform: "translateY(-100%)",
            background: "var(--bg-primary)",
            color: "var(--text-primary)",
            border: "1px solid var(--border)",
            borderRadius: "4px",
            padding: "4px 8px",
            fontSize: "11px",
            fontFamily: "system-ui, sans-serif",
            maxWidth: "280px",
            whiteSpace: "normal",
            textAlign: "left",
            pointerEvents: "none",
            zIndex: 9999,
          }}
        >
          <b style={{ color: "var(--text-warning)" }}>Offline rates.</b> {message}
        </span>
      )}
    </span>
  );
}

interface ResultLineProps {
  result: LineResult;
  /** The line is still being typed: show a pending indicator instead of its error. */
  pending?: boolean;
  /** The error was just revealed by a blocked Enter: animate it in. */
  revealed?: boolean;
}

export function ResultLine({
  result,
  pending = false,
  revealed = false,
}: ResultLineProps): React.JSX.Element {
  const [copied, setCopied] = useState(false);

  const handleClick = useCallback(() => {
    if (!result.formatted) return;
    navigator.clipboard.writeText(result.formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [result.formatted]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (!result.formatted) return;
      e.preventDefault();

      // Parse value and unit from formatted string
      const formatted = result.formatted;
      const valueOnly = result.value !== null ? String(result.value) : "";

      const menu = document.createElement("div");
      menu.className = "context-menu";
      menu.style.cssText = `
        position: fixed;
        left: ${e.clientX}px;
        top: ${e.clientY}px;
        background: var(--bg-primary);
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 4px 0;
        z-index: 1000;
        min-width: 150px;
        font-family: system-ui, sans-serif;
        font-size: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      `;

      const items = [
        { label: "Copy value", value: valueOnly },
        { label: "Copy formatted", value: formatted },
      ];

      for (const item of items) {
        const div = document.createElement("div");
        div.textContent = item.label;
        div.style.cssText = `
          padding: 6px 12px;
          cursor: pointer;
          color: var(--text-primary);
        `;
        div.addEventListener("mouseenter", () => {
          div.style.background = "var(--hover)";
        });
        div.addEventListener("mouseleave", () => {
          div.style.background = "transparent";
        });
        div.addEventListener("click", () => {
          navigator.clipboard.writeText(item.value);
          menu.remove();
        });
        menu.appendChild(div);
      }

      document.body.appendChild(menu);

      const dismiss = () => {
        menu.remove();
        document.removeEventListener("click", dismiss);
      };
      setTimeout(() => document.addEventListener("click", dismiss), 0);
    },
    [result],
  );

  return (
    <div
      className="select-none"
      style={{
        lineHeight: "1.6",
        minHeight: "1.6em",
        textAlign: "right",
        paddingRight: "8px",
        cursor: result.formatted ? "pointer" : "default",
        position: "relative",
      }}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      {copied && (
        <span
          style={{
            position: "absolute",
            right: "8px",
            top: "-18px",
            background: "var(--accent)",
            color: "#fff",
            padding: "2px 8px",
            borderRadius: "4px",
            fontSize: "11px",
            fontFamily: "system-ui, sans-serif",
            whiteSpace: "nowrap",
          }}
        >
          Copied!
        </span>
      )}
      {result.error && pending ? (
        <span className="result-pending" data-testid="result-pending" aria-label="pending">
          <i />
          <i />
          <i />
        </span>
      ) : result.error ? (
        <span
          data-testid="result-error"
          className={revealed ? "result-error-reveal" : undefined}
          style={{ color: "var(--text-error)", fontSize: "12px", opacity: 0.7 }}
        >
          {result.error}
        </span>
      ) : (
        <>
          {result.warning && <WarningBadge message={result.warning} />}
          <span
            data-testid="result-value"
            style={{
              color: "var(--text-result)",
              transition: "opacity 0.15s",
            }}
            className="hover:opacity-80"
          >
            {result.formatted}
          </span>
        </>
      )}
    </div>
  );
}
