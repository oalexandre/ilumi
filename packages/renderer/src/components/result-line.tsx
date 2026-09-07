import { useState, useCallback } from "react";
import type { LineResult } from "@engine/index";

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
      )}
    </div>
  );
}
