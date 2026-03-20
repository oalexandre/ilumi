import { useState, useCallback, useRef } from "react";
import type { LineResult } from "@engine/index";

const DEBOUNCE_MS = 50;

export function useEngine(): {
  results: LineResult[];
  evaluate: (text: string) => void;
} {
  const [results, setResults] = useState<LineResult[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const evaluate = useCallback((text: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(async () => {
      const evaluated = await window.numi.evaluate(text);
      setResults(evaluated);
    }, DEBOUNCE_MS);
  }, []);

  return { results, evaluate };
}
