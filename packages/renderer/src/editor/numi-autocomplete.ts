import {
  autocompletion,
  type CompletionContext,
  type CompletionResult,
} from "@codemirror/autocomplete";

const FUNCTIONS = [
  { label: "sqrt", detail: "square root" },
  { label: "cbrt", detail: "cube root" },
  { label: "abs", detail: "absolute value" },
  { label: "ceil", detail: "round up" },
  { label: "floor", detail: "round down" },
  { label: "round", detail: "round nearest" },
  { label: "trunc", detail: "truncate decimals" },
  { label: "sin", detail: "sine" },
  { label: "cos", detail: "cosine" },
  { label: "tan", detail: "tangent" },
  { label: "asin", detail: "arc sine" },
  { label: "acos", detail: "arc cosine" },
  { label: "atan", detail: "arc tangent" },
  { label: "log", detail: "log base 10" },
  { label: "log2", detail: "log base 2" },
  { label: "ln", detail: "natural log" },
  { label: "exp", detail: "e^x" },
  { label: "min", detail: "minimum" },
  { label: "max", detail: "maximum" },
  { label: "sign", detail: "sign (-1, 0, 1)" },
];

const CONSTANTS = [
  { label: "pi", detail: "3.14159..." },
  { label: "e", detail: "2.71828..." },
  { label: "tau", detail: "6.28318..." },
];

const KEYWORDS = [
  { label: "sum", detail: "sum of lines above" },
  { label: "avg", detail: "average of lines above" },
  { label: "total", detail: "alias for sum" },
  { label: "prev", detail: "previous line result" },
  { label: "count", detail: "count of lines with values" },
  { label: "today", detail: "current date" },
  { label: "tomorrow", detail: "tomorrow's date" },
  { label: "yesterday", detail: "yesterday's date" },
  { label: "now", detail: "current date/time" },
];

const BASE_TARGETS = [
  { label: "hex", detail: "hexadecimal" },
  { label: "binary", detail: "binary" },
  { label: "octal", detail: "octal" },
  { label: "decimal", detail: "decimal" },
];

// Cache for unit completions
let allUnitsCache: string[] | null = null;
const compatibleCache: Map<string, string[]> = new Map();

async function getAllUnits(): Promise<string[]> {
  if (allUnitsCache) return allUnitsCache;
  try {
    allUnitsCache = await window.numi.getAllUnits();
    return allUnitsCache;
  } catch {
    return [];
  }
}

async function getCompatible(unit: string): Promise<string[]> {
  const cached = compatibleCache.get(unit.toLowerCase());
  if (cached) return cached;
  try {
    const result = await window.numi.getCompletions(unit);
    compatibleCache.set(unit.toLowerCase(), result);
    return result;
  } catch {
    return [];
  }
}

async function numiCompletions(context: CompletionContext): Promise<CompletionResult | null> {
  // Get the current line text up to cursor
  const line = context.state.doc.lineAt(context.pos);
  const textBefore = line.text.slice(0, context.pos - line.from);

  // Check if we're after "in", "to", or "as" — offer compatible units
  const conversionMatch = textBefore.match(
    /(\S+)\s+(?:in|to|as)\s+(\S*)$/i,
  );
  if (conversionMatch) {
    const sourceUnit = conversionMatch[1] ?? "";
    const typed = conversionMatch[2] ?? "";
    const from = context.pos - typed.length;

    // Get compatible units for the source
    const compatible = await getCompatible(sourceUnit);
    const baseOptions = BASE_TARGETS.filter((b) =>
      b.label.startsWith(typed.toLowerCase()),
    ).map((b) => ({ ...b, type: "keyword" as const }));

    const unitOptions = compatible
      .filter((u) => u.toLowerCase().startsWith(typed.toLowerCase()))
      .map((u) => ({ label: u, type: "unit" as const }));

    const options = [...baseOptions, ...unitOptions];
    if (options.length === 0) return null;

    return { from, options, filter: false };
  }

  // Check if we're typing a word
  const wordMatch = textBefore.match(/([a-zA-Z_]\w*)$/);
  if (!wordMatch) {
    // Only complete on explicit Ctrl+Space
    if (!context.explicit) return null;
    return null;
  }

  const word = wordMatch[1] ?? "";
  const from = context.pos - word.length;

  // Don't complete single characters unless explicit
  if (word.length < 2 && !context.explicit) return null;

  const allUnits = await getAllUnits();

  const options = [
    ...FUNCTIONS.filter((f) => f.label.startsWith(word.toLowerCase())).map((f) => ({
      ...f,
      type: "function" as const,
    })),
    ...CONSTANTS.filter((c) => c.label.startsWith(word.toLowerCase())).map((c) => ({
      ...c,
      type: "constant" as const,
    })),
    ...KEYWORDS.filter((k) => k.label.startsWith(word.toLowerCase())).map((k) => ({
      ...k,
      type: "keyword" as const,
    })),
    ...allUnits
      .filter(
        (u) =>
          u.toLowerCase().startsWith(word.toLowerCase()) && u.length > 1,
      )
      .slice(0, 15)
      .map((u) => ({ label: u, type: "unit" as const })),
  ];

  if (options.length === 0) return null;

  return { from, options, filter: false };
}

export const numiAutocompletion = autocompletion({
  override: [numiCompletions],
  activateOnTyping: false, // Only on Ctrl+Space by default
  defaultKeymap: true,
});
