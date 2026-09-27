// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import type { LineResult } from "@engine/index";

import { ResultsPane } from "./results-pane";

const results: LineResult[] = [
  { line: 0, value: 3, formatted: "3" },
  { line: 1, value: null, formatted: "", error: "Unexpected end" },
  { line: 2, value: null, formatted: "", error: "Unknown unit" },
];

function renderPane(props: Partial<Parameters<typeof ResultsPane>[0]> = {}) {
  const { container } = render(
    <ResultsPane
      results={results}
      scrollTop={0}
      lineHeights={[]}
      editingLine={null}
      revealedLine={null}
      {...props}
    />,
  );
  const pane = container.firstChild as HTMLElement;
  const rows = Array.from(pane.firstElementChild?.children ?? []) as HTMLElement[];
  return { pane, rows };
}

function rowState(row: HTMLElement): string {
  if (row.querySelector("[data-testid=result-pending]")) return "pending";
  const error = row.querySelector("[data-testid=result-error]");
  if (error) return error.className === "result-error-reveal" ? "revealed" : "error";
  return row.querySelector("[data-testid=result-value]")?.textContent ?? "";
}

describe("ResultsPane", () => {
  it("renders one row per result", () => {
    const { rows } = renderPane();
    expect(rows.map(rowState)).toEqual(["3", "error", "error"]);
  });

  it("shows the error of the line being edited as pending", () => {
    const { rows } = renderPane({ editingLine: 1 });
    expect(rows.map(rowState)).toEqual(["3", "pending", "error"]);
  });

  it("does not mark a line without an error as pending", () => {
    const { rows } = renderPane({ editingLine: 0 });
    expect(rows.map(rowState)).toEqual(["3", "error", "error"]);
  });

  it("shows a revealed error even on the line being edited", () => {
    const { rows } = renderPane({ editingLine: 1, revealedLine: 1 });
    expect(rows.map(rowState)).toEqual(["3", "revealed", "error"]);
  });

  it("reveals an error on a line other than the edited one", () => {
    const { rows } = renderPane({ editingLine: 1, revealedLine: 2 });
    expect(rows.map(rowState)).toEqual(["3", "pending", "revealed"]);
  });

  it("applies each line's height to its row", () => {
    const { rows } = renderPane({ lineHeights: [22, 66, 22] });
    expect(rows.map((r) => r.style.height)).toEqual(["22px", "66px", "22px"]);
  });

  it("falls back to one row height for lines without a measured height", () => {
    const { rows } = renderPane({ lineHeights: [44] });
    expect(rows.map((r) => r.style.height)).toEqual(["44px", "1.6em", "1.6em"]);
  });

  it("syncs its scroll position with the editor", () => {
    const { pane } = renderPane({ scrollTop: 120 });
    expect(pane.scrollTop).toBe(120);
  });
});
