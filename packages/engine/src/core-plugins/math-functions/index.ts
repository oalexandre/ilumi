import type { PluginManifest } from "../types.js";

/**
 * `round(x)` or `round(x, digits)`. Nudging by EPSILON keeps halves that binary floating point
 * stores just below .5 (1.005 is 1.00499…) rounding up as written.
 */
function round(x: number, digits = 0): number {
  if (!digits) return Math.round(x);
  const factor = 10 ** Math.trunc(digits);
  return Math.round(x * factor * (1 + Number.EPSILON)) / factor;
}

export const mathFunctionsPlugin: PluginManifest = {
  id: "core.math-functions",
  name: "Math Functions",
  description: "Built-in mathematical functions",
  functions: {
    // Basic
    sqrt: { fn: Math.sqrt, detail: "square root" },
    cbrt: { fn: Math.cbrt, detail: "cube root" },
    abs: { fn: Math.abs, detail: "absolute value" },
    ceil: { fn: Math.ceil, detail: "round up" },
    floor: { fn: Math.floor, detail: "round down" },
    round: { fn: round, detail: "round nearest (optional decimal places)" },
    trunc: { fn: Math.trunc, detail: "truncate decimals" },
    sign: { fn: Math.sign, detail: "sign (-1, 0, 1)" },
    exp: { fn: Math.exp, detail: "e^x" },

    // Trigonometric
    sin: { fn: Math.sin, detail: "sine" },
    cos: { fn: Math.cos, detail: "cosine" },
    tan: { fn: Math.tan, detail: "tangent" },
    asin: { fn: Math.asin, detail: "arc sine" },
    acos: { fn: Math.acos, detail: "arc cosine" },
    atan: { fn: Math.atan, detail: "arc tangent" },

    // Logarithmic
    log: { fn: Math.log10, detail: "log base 10" },
    log10: { fn: Math.log10, detail: "log base 10" },
    ln: { fn: Math.log, detail: "natural log" },
    log2: { fn: Math.log2, detail: "log base 2" },

    // Multi-arg
    min: { fn: Math.min, detail: "minimum" },
    max: { fn: Math.max, detail: "maximum" },
  },
  tests: [
    { description: "sqrt(16) = 4", input: "sqrt(16)", expected: 4 },
    { description: "cbrt(27) = 3", input: "cbrt(27)", expected: 3 },
    { description: "abs(-5) = 5", input: "abs(-5)", expected: 5 },
    { description: "ceil(4.1) = 5", input: "ceil(4.1)", expected: 5 },
    { description: "floor(4.9) = 4", input: "floor(4.9)", expected: 4 },
    { description: "round(4.5) = 5", input: "round(4.5)", expected: 5 },
    { description: "round(10 / 3, 2) = 3.33", input: "round(10 / 3, 2)", expected: 3.33 },
    { description: "trunc(4.9) = 4", input: "trunc(4.9)", expected: 4 },
    { description: "sign(-3) = -1", input: "sign(-3)", expected: -1 },
    { description: "exp(0) = 1", input: "exp(0)", expected: 1 },
    { description: "sin(0) = 0", input: "sin(0)", expected: 0 },
    { description: "cos(0) = 1", input: "cos(0)", expected: 1 },
    { description: "tan(0) = 0", input: "tan(0)", expected: 0 },
    { description: "asin(1) ≈ π/2", input: "asin(1)", expected: Math.PI / 2, tolerance: 0.0001 },
    { description: "acos(1) = 0", input: "acos(1)", expected: 0 },
    { description: "atan(1) ≈ π/4", input: "atan(1)", expected: Math.PI / 4, tolerance: 0.0001 },
    { description: "log(100) = 2", input: "log(100)", expected: 2 },
    { description: "log10(1000) = 3", input: "log10(1000)", expected: 3 },
    { description: "ln(e) ≈ 1", input: "ln(e)", expected: 1, tolerance: 0.0001 },
    { description: "log2(8) = 3", input: "log2(8)", expected: 3 },
    { description: "min(3, 1, 2) = 1", input: "min(3, 1, 2)", expected: 1 },
    { description: "max(3, 1, 2) = 3", input: "max(3, 1, 2)", expected: 3 },
    { description: "sqrt with space syntax", input: "sqrt 25", expected: 5 },
  ],
  help: [
    {
      title: "Math Functions",
      description: "Use with parentheses or a space: sqrt(16) or sqrt 16",
      examples: [
        { input: "sqrt(16)", output: "4" },
        { input: "abs(-5)", output: "5" },
        { input: "ceil(4.1)", output: "5" },
        { input: "floor(4.9)", output: "4" },
        { input: "round(4.5)", output: "5" },
        { input: "sin(0), cos(0), tan(0)", output: "trig" },
        { input: "log(100)", output: "2", desc: "log base 10" },
        { input: "ln(e)", output: "1", desc: "natural log" },
        { input: "min(3, 1, 2)", output: "1" },
        { input: "max(3, 1, 2)", output: "3" },
      ],
    },
  ],
};
