import { describe, it, expect, vi } from "vitest";

import { Document, createEntityRegistry, type LineResult } from "./index.js";

/*
 * Complex expressions and large documents: results must be right and evaluation must stay
 * fast enough to run on every keystroke (the renderer debounces by 50 ms).
 *
 * Budgets are about 10x what a laptop measures, so a slow CI runner passes while an
 * accidental O(n²) or exponential parse still fails. Scaling tests compare two sizes of
 * the same document instead of absolute times, which catches complexity regressions on
 * any machine.
 */

const registry = createEntityRegistry();

function evaluate(source: string): LineResult[] {
  return new Document(registry).update(source);
}

/** Median time of `runs` calls after one warm-up call, in milliseconds. */
function medianMs(fn: () => unknown, runs = 3): number {
  fn();
  const times: number[] = [];
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    fn();
    times.push(performance.now() - start);
  }
  times.sort((a, b) => a - b);
  return times[Math.floor(runs / 2)]!;
}

function lines(count: number, make: (i: number) => string): string {
  return Array.from({ length: count }, (_, i) => make(i)).join("\n");
}

/** Values of every line, failing loudly on the first error. */
function values(source: string): (number | null)[] {
  return evaluate(source).map((r) => {
    if (r.error) throw new Error(`line ${r.line + 1}: ${r.error}`);
    return r.value;
  });
}

function last<T>(items: T[]): T {
  return items[items.length - 1]!;
}

describe("complex expressions", () => {
  it("respects precedence across nested groups, powers and division", () => {
    expect(values("((2 + 3) * (4 - 1) ^ 2 - 10 / (5 - 3)) * 2")).toEqual([80]);
    expect(values("10 mod 3 + 7 mod 4 * 2")).toEqual([7]);
    expect(values("1e3 * 2.5e-2")).toEqual([25]);
  });

  it("nests function calls with several arguments", () => {
    expect(values("round(sqrt(abs(-16)) * max(3, min(10, 7)) + log(1000) ^ 2, 2)")).toEqual([37]);
    expect(values("sin(pi / 2) + cos(0) + tan(0)")).toEqual([2]);
  });

  it("adds mixed units inside groups before converting", () => {
    const [meters] = values("(1 km + 500 m + 250 cm) in m");
    expect(meters).toBeCloseTo(1502.5, 10);
    const [minutes] = values("2 hours + 45 minutes + 30 seconds in minutes");
    expect(minutes).toBeCloseTo(165.5, 10);
  });

  it("chains percentages and percent-of over groups", () => {
    const [chained] = values("200 + 10% - 5%");
    expect(chained).toBeCloseTo(209, 10);
    expect(values("20% of (150 + 50) * 2")).toEqual([80]);
  });

  it("computes compound interest from a percent variable", () => {
    const doc = "principal = 1000\nrate = 5%\nyears = 10\nround(principal * (1 + rate) ^ years, 2)";
    expect(last(values(doc))).toBe(1628.89);
  });

  it("mixes variables, functions and line references", () => {
    const doc = "a = 3\nb = 4\nhyp = sqrt(a ^ 2 + b ^ 2)\nhyp * 2 + prev";
    expect(values(doc)).toEqual([3, 4, 5, 15]);
  });

  it("combines number bases with arithmetic", () => {
    expect(evaluate("0xFF + 0b1010 in hex")[0]?.formatted).toBe("0x109");
  });

  it("evaluates groups nested in different shapes", () => {
    // 3 * (3 + (4 - (5 - 6))) = 24 over (7 - 8) + 9 * (10 / (11 - 1)) = 8
    expect(values("((1 + 2) * (3 + (4 - (5 - 6)))) / ((7 - 8) + (9 * (10 / (11 - 1))))")).toEqual([
      3,
    ]);
    expect(values("(((2)))")).toEqual([2]);
    expect(values("(1 + (2 * (3 + (4 * (5 + 6)))))")).toEqual([95]);
    expect(values("((10 - 4) / (1 + 2)) * ((3 + 3) / (4 - 2))")).toEqual([6]);
  });

  it("matches JavaScript on random nested arithmetic", () => {
    // Seeded generator: the same 300 expressions every run, so a failure is reproducible.
    let seed = 20260927;
    const random = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    const expression = (depth: number): string => {
      if (depth === 0 || random() < 0.25) return String(1 + Math.floor(random() * 99));
      const op = ["+", "-", "*", "/"][Math.floor(random() * 4)]!;
      const left = expression(depth - 1);
      const right = expression(depth - 1);
      return random() < 0.6 ? `(${left} ${op} ${right})` : `${left} ${op} ${right}`;
    };

    for (let i = 0; i < 300; i++) {
      const src = expression(6);
      const expected = Function(`"use strict"; return (${src});`)() as number;
      const result = evaluate(src)[0]!;
      if (!Number.isFinite(expected)) continue;
      expect(result.error, src).toBeUndefined();
      expect(result.value! / (Math.abs(expected) || 1), src).toBeCloseTo(
        expected / (Math.abs(expected) || 1),
        9,
      );
    }
  });

  it("evaluates 200 levels of nested parentheses", () => {
    const depth = 200;
    const src = "(".repeat(depth) + "1 + 1" + ")".repeat(depth);
    expect(values(src)).toEqual([2]);
    expect(medianMs(() => evaluate(src))).toBeLessThan(20);
  });

  it("evaluates 50 nested function calls", () => {
    const src = "abs(".repeat(50) + "-7" + ")".repeat(50);
    expect(values(src)).toEqual([7]);
    expect(medianMs(() => evaluate(src))).toBeLessThan(20);
  });

  it("rejects deeply unbalanced parentheses without backtracking blow-up", () => {
    const src = "(".repeat(60) + "1 +";
    expect(evaluate(src)[0]?.errorKind).toBe("syntax");
    expect(medianMs(() => evaluate(src))).toBeLessThan(20);
  });

  it("sums a 1000-term line", () => {
    const src = Array.from({ length: 1000 }, (_, i) => i + 1).join(" + ");
    expect(values(src)).toEqual([500500]);
    expect(medianMs(() => evaluate(src))).toBeLessThan(50);
  });

  it("converts a 300-term sum of units", () => {
    const src = Array.from({ length: 300 }, () => "1 km").join(" + ") + " in m";
    const [meters] = values(src);
    expect(meters).toBeCloseTo(300000, 6);
    expect(medianMs(() => evaluate(src))).toBeLessThan(50);
  });

  it("reports a clear error for a line too long to evaluate", () => {
    // Parser and evaluator recurse per operator; a pasted column of thousands of terms
    // must fail with a readable message, not V8's stack overflow or "Syntax error".
    for (const terms of [5000, 20000]) {
      const src = Array.from({ length: terms }, () => "1").join(" + ");
      expect(evaluate(src)[0]?.error).toBe("Expression too long");
    }
  });
});

describe("large documents", () => {
  const dependentChain = lines(1000, (i) =>
    i === 0 ? "v0 = 1" : `v${i} = v${i - 1} * 1.001 + ${i}`,
  );

  // A realistic note repeated to 1000 lines: every kind of line the app supports.
  const mixedNote = lines(1000, (i) => {
    const kinds = [
      `item${i} = ${i} * 1.5`,
      `item${i - 1} + 8%`,
      "5 km in miles",
      "sum",
      "prev * 2",
      "today + 3 days",
      "255 in hex",
      `round(sqrt(item${i - 7}) * pi, 2)`,
      "// comment",
      "",
    ];
    return kinds[i % kinds.length]!;
  });

  it("evaluates 1000 lines that each depend on the previous one", () => {
    let expected = 1;
    for (let i = 1; i < 1000; i++) expected = expected * 1.001 + i;
    const results = evaluate(dependentChain);
    expect(results).toHaveLength(1000);
    expect(last(results).value).toBeCloseTo(expected, 6);
    expect(medianMs(() => evaluate(dependentChain))).toBeLessThan(200);
  });

  it("evaluates a 1000-line note mixing every feature without errors", () => {
    const results = evaluate(mixedNote);
    expect(results.filter((r) => r.error)).toEqual([]);
    expect(medianMs(() => evaluate(mixedNote))).toBeLessThan(200);
  });

  it("sums 5000 lines", () => {
    const src = lines(5000, (i) => String(i + 1)) + "\nsum";
    expect(last(values(src))).toBe((5000 * 5001) / 2);
    expect(medianMs(() => evaluate(src))).toBeLessThan(500);
  });

  it("re-evaluates a 1000-line note within a keystroke budget", () => {
    // Typing on the first line invalidates all 999 dependants: the worst case per keystroke.
    const doc = new Document(registry);
    doc.update(dependentChain);
    let n = 1;
    const time = medianMs(() => doc.update(dependentChain.replace("v0 = 1", `v0 = ${++n}`)));
    expect(time).toBeLessThan(100);

    // Typing at the end of the note only reparses the edited line.
    const doc2 = new Document(registry);
    doc2.update(mixedNote);
    let suffix = 0;
    const timeAtEnd = medianMs(() => doc2.update(`${mixedNote}\n${++suffix}`));
    expect(timeAtEnd).toBeLessThan(100);
  });

  it("keeps incremental results identical to a fresh evaluation", () => {
    // `today` reads the clock; freeze it so both evaluations see the same instant.
    vi.useFakeTimers({ now: new Date(2026, 0, 15, 12), toFake: ["Date"] });
    try {
      const doc = new Document(registry);
      doc.update(mixedNote);
      const edited = mixedNote.replace("item0 = 0 * 1.5", "item0 = 42 * 1.5");
      const incremental = doc.update(edited);
      expect(incremental).toEqual(evaluate(edited));
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("scaling", () => {
  /**
   * Time ratio between a document 4x larger and the base one. Linear ≈ 4, quadratic ≈ 16.
   * Uses the fastest of several runs: noise from a busy machine only ever adds time.
   */
  function growth(make: (size: number) => string, size: number): number {
    const fastest = (source: string) => {
      evaluate(source);
      let best = Infinity;
      for (let i = 0; i < 5; i++) {
        const start = performance.now();
        evaluate(source);
        best = Math.min(best, performance.now() - start);
      }
      return best;
    };
    return fastest(make(size * 4)) / fastest(make(size));
  }

  it("grows linearly with dependent variables", () => {
    const make = (n: number) => lines(n, (i) => (i === 0 ? "v0 = 1" : `v${i} = v${i - 1} + 1`));
    expect(growth(make, 1000)).toBeLessThan(9);
  });

  it("grows linearly with repeated sum lines", () => {
    // Each `sum` looks back over the lines above; that must not turn quadratic.
    const make = (n: number) => lines(n, (i) => (i % 2 ? "sum" : String(i)));
    expect(growth(make, 1000)).toBeLessThan(9);
  });

  it("grows linearly with the number of terms on one line", () => {
    const make = (n: number) => Array.from({ length: n }, (_, i) => i).join(" + ");
    expect(growth(make, 250)).toBeLessThan(9);
  });
});
