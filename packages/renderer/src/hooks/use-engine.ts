import { useState, useCallback, useRef } from "react";
import type { LineResult } from "@engine/index";

const DEBOUNCE_MS = 50;

export function useEngine(): {
  results: LineResult[];
  evaluate: (text: string) => void;
  evaluateNow: (text: string) => Promise<LineResult[]>;
} {
  const [results, setResults] = useState<LineResult[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPending = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /** Evaluate immediately, bypassing the debounce. Used when the answer is needed synchronously (e.g. Enter). */
  const evaluateNow = useCallback(
    async (text: string): Promise<LineResult[]> => {
      clearPending();
      const evaluated = await window.numi.evaluate(text);
      setResults(evaluated);
      return evaluated;
    },
    [clearPending],
  );

  const evaluate = useCallback(
    (text: string) => {
      clearPending();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        void evaluateNow(text);
      }, DEBOUNCE_MS);
    },
    [clearPending, evaluateNow],
  );

  return { results, evaluate, evaluateNow };
}
