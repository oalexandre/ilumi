import { useRef, useEffect } from "react";
import type { LineResult } from "@engine/index";

import { ResultLine } from "./result-line";

interface ResultsPaneProps {
  results: LineResult[];
  scrollTop: number;
  /** Height of each editor line, so a wrapped line keeps its result aligned with the next one. */
  lineHeights: number[];
  /** Line being typed on: its error is shown as a pending indicator instead. */
  editingLine: number | null;
  /** Line whose error was revealed by a blocked Enter. */
  revealedLine: number | null;
}

export function ResultsPane({
  results,
  scrollTop,
  lineHeights,
  editingLine,
  revealedLine,
}: ResultsPaneProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = scrollTop;
    }
  }, [scrollTop]);

  return (
    <div
      ref={containerRef}
      className="flex-[0_0_40%] overflow-hidden"
      style={{
        background: "var(--bg-results)",
        borderLeft: "1px solid var(--border)",
      }}
    >
      <div style={{ padding: "16px", paddingBottom: "50vh" }}>
        {results.map((result) => (
          <ResultLine
            key={result.line}
            result={result}
            height={lineHeights[result.line]}
            pending={!!result.error && result.line === editingLine && result.line !== revealedLine}
            revealed={result.line === revealedLine}
          />
        ))}
      </div>
    </div>
  );
}
