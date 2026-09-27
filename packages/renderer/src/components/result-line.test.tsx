// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { LineResult } from "@engine/index";

import { ResultLine } from "./result-line";

function stubClipboard() {
  const writeText = vi.fn((_text: string) => Promise.resolve());
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
  return writeText;
}

const value: LineResult = { line: 0, value: 42, formatted: "42 km" };
const error: LineResult = { line: 1, value: null, formatted: "", error: "Unknown unit: foo" };

describe("ResultLine", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.querySelectorAll(".context-menu").forEach((m) => m.remove());
  });

  it("renders the formatted value", () => {
    render(<ResultLine result={value} />);
    expect(screen.getByTestId("result-value").textContent).toBe("42 km");
    expect(screen.queryByTestId("result-error")).toBeNull();
    expect(screen.queryByTestId("result-warning")).toBeNull();
  });

  it("puts the full value in the title so a truncated value can be read", () => {
    const long = "123456789012345678901234567890.123456789 USD";
    const { container } = render(<ResultLine result={{ line: 0, value: 1, formatted: long }} />);
    expect((container.firstChild as HTMLElement).getAttribute("title")).toBe(long);
  });

  it("has an empty title for an empty result", () => {
    const { container } = render(<ResultLine result={{ line: 0, value: null, formatted: "" }} />);
    expect((container.firstChild as HTMLElement).getAttribute("title")).toBe("");
  });

  it("renders the error message", () => {
    render(<ResultLine result={error} />);
    const el = screen.getByTestId("result-error");
    expect(el.textContent).toBe("Unknown unit: foo");
    expect(el.className).toBe("");
    expect(screen.queryByTestId("result-value")).toBeNull();
  });

  it("marks a revealed error for the reveal animation", () => {
    render(<ResultLine result={error} revealed />);
    expect(screen.getByTestId("result-error").className).toBe("result-error-reveal");
  });

  it("shows pending dots instead of the error while the line is being typed", () => {
    render(<ResultLine result={error} pending />);
    const pending = screen.getByTestId("result-pending");
    expect(pending.getAttribute("aria-label")).toBe("pending");
    expect(pending.querySelectorAll("i")).toHaveLength(3);
    expect(screen.queryByTestId("result-error")).toBeNull();
  });

  it("ignores pending when there is no error", () => {
    render(<ResultLine result={value} pending />);
    expect(screen.queryByTestId("result-pending")).toBeNull();
    expect(screen.getByTestId("result-value").textContent).toBe("42 km");
  });

  it("shows a warning badge next to the value", () => {
    const warning = "Exchange rates are from the bundled offline table.";
    render(<ResultLine result={{ ...value, warning }} />);
    const badge = screen.getByTestId("result-warning");
    expect(badge.getAttribute("aria-label")).toBe(warning);
    expect(screen.getByTestId("result-value").textContent).toBe("42 km");
  });

  it("shows the warning tooltip on hover and hides it on leave", () => {
    render(<ResultLine result={{ ...value, warning: "Stale rates." }} />);
    const badge = screen.getByTestId("result-warning");
    fireEvent.mouseEnter(badge);
    expect(badge.textContent).toBe("Offline rates. Stale rates.");
    fireEvent.mouseLeave(badge);
    expect(badge.textContent).toBe("");
  });

  it("does not copy when the warning badge is clicked", () => {
    const writeText = stubClipboard();
    render(<ResultLine result={{ ...value, warning: "Stale rates." }} />);
    fireEvent.click(screen.getByTestId("result-warning"));
    expect(writeText).not.toHaveBeenCalled();
  });

  it("copies the formatted value on click and shows Copied! for 1.5 s", () => {
    const writeText = stubClipboard();
    render(<ResultLine result={value} />);
    fireEvent.click(screen.getByTestId("result-value"));
    expect(writeText).toHaveBeenCalledWith("42 km");
    expect(screen.getByText("Copied!").textContent).toBe("Copied!");
    act(() => vi.advanceTimersByTime(1499));
    expect(screen.queryByText("Copied!")).not.toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByText("Copied!")).toBeNull();
  });

  it("does not copy an empty result", () => {
    const writeText = stubClipboard();
    const { container } = render(<ResultLine result={error} />);
    fireEvent.click(container.firstChild as HTMLElement);
    expect(writeText).not.toHaveBeenCalled();
    expect(screen.queryByText("Copied!")).toBeNull();
  });

  it("uses the height prop as the row height", () => {
    const { container } = render(<ResultLine result={value} height={67} />);
    expect((container.firstChild as HTMLElement).style.height).toBe("67px");
  });

  it("defaults to a single row height", () => {
    const { container } = render(<ResultLine result={value} />);
    expect((container.firstChild as HTMLElement).style.height).toBe("1.6em");
  });

  it("offers copy value / copy formatted in the context menu", () => {
    const writeText = stubClipboard();
    const { container } = render(<ResultLine result={value} />);
    fireEvent.contextMenu(container.firstChild as HTMLElement, { clientX: 10, clientY: 20 });
    const menu = document.querySelector(".context-menu") as HTMLElement;
    const items = Array.from(menu.children) as HTMLElement[];
    expect(items.map((i) => i.textContent)).toEqual(["Copy value", "Copy formatted"]);
    items[0]?.click();
    expect(writeText).toHaveBeenCalledWith("42");
    expect(document.querySelector(".context-menu")).toBeNull();
  });

  it("dismisses the context menu on the next outside click", () => {
    stubClipboard();
    const { container } = render(<ResultLine result={value} />);
    fireEvent.contextMenu(container.firstChild as HTMLElement);
    act(() => vi.advanceTimersByTime(0));
    document.body.click();
    expect(document.querySelector(".context-menu")).toBeNull();
  });

  it("has no context menu for an empty result", () => {
    const { container } = render(<ResultLine result={error} />);
    fireEvent.contextMenu(container.firstChild as HTMLElement);
    expect(document.querySelector(".context-menu")).toBeNull();
  });
});
