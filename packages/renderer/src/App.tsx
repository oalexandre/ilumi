import { useState, useCallback } from "react";
import type { LineResult } from "@engine/index";

export function App(): React.JSX.Element {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<LineResult[]>([]);

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setInput(value);
      const evaluated = await window.numi.evaluate(value);
      setResults(evaluated);
    },
    [],
  );

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "monospace" }}>
      <div style={{ flex: "0 0 60%", padding: "16px" }}>
        <textarea
          value={input}
          onChange={handleChange}
          placeholder="Type an expression..."
          style={{
            width: "100%",
            height: "100%",
            background: "transparent",
            color: "inherit",
            border: "none",
            outline: "none",
            resize: "none",
            fontFamily: "inherit",
            fontSize: "14px",
          }}
        />
      </div>
      <div
        style={{
          flex: "0 0 40%",
          padding: "16px",
          borderLeft: "1px solid var(--border, #313244)",
        }}
      >
        {results.map((result) => (
          <div key={result.line} style={{ fontSize: "14px", lineHeight: "1.5" }}>
            {result.error ? (
              <span style={{ color: "var(--text-error, #F38BA8)" }}>{result.error}</span>
            ) : (
              <span style={{ color: "var(--text-result, #A6E3A1)" }}>{result.formatted}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
