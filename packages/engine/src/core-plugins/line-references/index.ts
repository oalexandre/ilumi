import type { PluginManifest, LineRefContext, LineResultEntry } from "../types.js";

function getAbove(ctx: LineRefContext): LineResultEntry[] {
  return ctx.previousResults
    .slice(0, ctx.currentLine)
    .filter((v): v is LineResultEntry => v !== null);
}

function sumHandler(ctx: LineRefContext): number {
  const entries = getAbove(ctx);
  let total = 0;
  for (const entry of entries) {
    if (entry.isPercent) {
      // Apply percentage to running total: e.g., total=10, entry=0.2 → 10 + 10*0.2 = 12
      total = total + total * entry.value;
    } else {
      total += entry.value;
    }
  }
  return total;
}

function avgHandler(ctx: LineRefContext): number {
  const entries = getAbove(ctx);
  if (entries.length === 0) return 0;
  const values = entries.map((e) => e.value);
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function prevHandler(ctx: LineRefContext): number {
  for (let i = ctx.currentLine - 1; i >= 0; i--) {
    const val = ctx.previousResults[i];
    if (val !== null && val !== undefined) return val.value;
  }
  return 0;
}

function countHandler(ctx: LineRefContext): number {
  return getAbove(ctx).length;
}

export const lineReferencesPlugin: PluginManifest = {
  id: "core.line-references",
  name: "Line References",
  description: "Reference previous line results (sum, avg, prev, count)",
  tests: [
    { description: "sum of lines above", input: "10\n20\n30\nsum", line: 3, expected: 60 },
    { description: "total alias for sum", input: "10\n20\ntotal", line: 2, expected: 30 },
    { description: "avg of lines above", input: "10\n20\n30\navg", line: 3, expected: 20 },
    { description: "average alias", input: "100\n200\naverage", line: 2, expected: 150 },
    { description: "prev returns last value", input: "42\nprev", line: 1, expected: 42 },
    { description: "prev skips empty lines", input: "42\n\nprev", line: 2, expected: 42 },
    { description: "count of valued lines", input: "10\n20\n30\ncount", line: 3, expected: 3 },
    { description: "count skips comments", input: "10\n// note\n20\ncount", line: 3, expected: 2 },
    { description: "sum skips dates", input: "10\ntoday\n20\nsum", line: 3, expected: 30 },
  ],
  lineRefs: {
    sum: { handler: sumHandler, detail: "sum of lines above" },
    total: { handler: sumHandler, detail: "alias for sum" },
    avg: { handler: avgHandler, detail: "average of lines above" },
    average: { handler: avgHandler, detail: "average of lines above" },
    prev: { handler: prevHandler, detail: "previous line result" },
    previous: { handler: prevHandler, detail: "previous line result" },
    count: { handler: countHandler, detail: "count of lines with values" },
  },
  help: [
    {
      title: "Line References",
      description: "Reference results from lines above.",
      examples: [
        { input: "sum", output: "sum of all above" },
        { input: "avg", output: "average of above" },
        { input: "prev", output: "previous line result" },
        { input: "count", output: "lines with values" },
      ],
    },
  ],
};
