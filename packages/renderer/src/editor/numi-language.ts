import { StreamLanguage, type StreamParser } from "@codemirror/language";

const FUNCTIONS = new Set([
  "sqrt", "cbrt", "abs", "ceil", "floor", "round", "trunc",
  "sin", "cos", "tan", "asin", "acos", "atan",
  "log", "ln", "log2", "log10", "exp", "sign",
  "min", "max",
]);

const CONSTANTS = new Set(["pi", "e", "tau"]);

const KEYWORDS = new Set([
  "in", "to", "as", "of", "off", "on", "mod",
  "AND", "OR", "XOR", "NOT",
  "today", "now", "tomorrow", "yesterday",
  "sum", "total", "avg", "average", "prev", "previous", "count",
  "hex", "binary", "bin", "octal", "oct", "decimal", "dec",
]);

interface NumiState {
  inComment: boolean;
}

const numiParser: StreamParser<NumiState> = {
  startState(): NumiState {
    return { inComment: false };
  },

  token(stream, state): string | null {
    // Comments
    if (stream.match("//") || stream.match("#")) {
      stream.skipToEnd();
      state.inComment = false;
      return "comment";
    }

    // Skip whitespace
    if (stream.eatSpace()) return null;

    // Hex numbers
    if (stream.match(/^0x[0-9a-fA-F]+/)) return "number";

    // Binary numbers
    if (stream.match(/^0b[01]+/)) return "number";

    // Scientific notation
    if (stream.match(/^[0-9]+(\.[0-9]+)?[eE][+-]?[0-9]+/)) return "number";

    // Decimal numbers
    if (stream.match(/^[0-9]+(\.[0-9]+)?/)) return "number";

    // Percentage
    if (stream.eat("%")) return "operator";

    // Operators
    if (stream.match("<<") || stream.match(">>")) return "operator";
    if (stream.match(/^[+\-*/^=()]/)) return "operator";

    // Words
    if (stream.match(/^[a-zA-Z_][a-zA-Z0-9_]*/)) {
      const word = stream.current();
      if (FUNCTIONS.has(word)) return "function";
      if (CONSTANTS.has(word)) return "atom";
      if (KEYWORDS.has(word)) return "keyword";
      return "variableName";
    }

    // Currency symbols
    if (stream.match(/^[$€£¥₹₩₺₽]/)) return "unit";

    // Skip unknown chars
    stream.next();
    return null;
  },
};

export const numiLanguage = StreamLanguage.define(numiParser);
