// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { LineResult } from "@engine/index";

import { useEngine } from "./use-engine";

function fakeResults(text: string): LineResult[] {
  return text.split("\n").map((line, i) => ({ line: i, value: i, formatted: `=${line}` }));
}

describe("useEngine", () => {
  let evaluate: ReturnType<typeof vi.fn<(text: string) => Promise<LineResult[]>>>;

  beforeEach(() => {
    vi.useFakeTimers();
    evaluate = vi.fn((text: string) => Promise.resolve(fakeResults(text)));
    (window as unknown as { numi: { evaluate: typeof evaluate } }).numi = { evaluate };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts with no results", () => {
    const { result } = renderHook(() => useEngine());
    expect(result.current.results).toEqual([]);
  });

  it("debounces evaluate by 50 ms", async () => {
    const { result } = renderHook(() => useEngine());
    act(() => result.current.evaluate("1 + 1"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(49);
    });
    expect(evaluate).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(evaluate).toHaveBeenCalledTimes(1);
    expect(evaluate).toHaveBeenCalledWith("1 + 1");
    expect(result.current.results).toEqual([{ line: 0, value: 0, formatted: "=1 + 1" }]);
  });

  it("only evaluates the last text of a burst", async () => {
    const { result } = renderHook(() => useEngine());
    act(() => result.current.evaluate("1"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30);
    });
    act(() => result.current.evaluate("12"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30);
    });
    act(() => result.current.evaluate("123"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });
    expect(evaluate).toHaveBeenCalledTimes(1);
    expect(evaluate).toHaveBeenCalledWith("123");
    expect(result.current.results).toEqual([{ line: 0, value: 0, formatted: "=123" }]);
  });

  it("evaluateNow evaluates immediately and returns the results", async () => {
    const { result } = renderHook(() => useEngine());
    let returned: LineResult[] = [];
    await act(async () => {
      returned = await result.current.evaluateNow("a\nb");
    });
    expect(evaluate).toHaveBeenCalledWith("a\nb");
    expect(returned).toEqual([
      { line: 0, value: 0, formatted: "=a" },
      { line: 1, value: 1, formatted: "=b" },
    ]);
    expect(result.current.results).toEqual(returned);
  });

  it("evaluateNow cancels a pending debounced evaluation", async () => {
    const { result } = renderHook(() => useEngine());
    act(() => result.current.evaluate("stale"));
    await act(async () => {
      await result.current.evaluateNow("fresh");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    expect(evaluate).toHaveBeenCalledTimes(1);
    expect(evaluate).toHaveBeenCalledWith("fresh");
    expect(result.current.results).toEqual([{ line: 0, value: 0, formatted: "=fresh" }]);
  });

  it("keeps the evaluate/evaluateNow identities stable across renders", async () => {
    const { result, rerender } = renderHook(() => useEngine());
    const { evaluate: first, evaluateNow: firstNow } = result.current;
    await act(async () => {
      await result.current.evaluateNow("1");
    });
    rerender();
    expect(result.current.evaluate).toBe(first);
    expect(result.current.evaluateNow).toBe(firstNow);
  });
});
