import { StreamLanguage, type StreamParser } from "@codemirror/language";
import { Compartment, type Extension } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";

// Default sets (used until dynamic data arrives from main process)
let FUNCTIONS = new Set([
  "sqrt",
  "cbrt",
  "abs",
  "ceil",
  "floor",
  "round",
  "trunc",
  "sin",
  "cos",
  "tan",
  "asin",
  "acos",
  "atan",
  "log",
  "ln",
  "log2",
  "log10",
  "exp",
  "sign",
  "min",
  "max",
]);

let CONSTANTS = new Set(["pi", "e", "tau"]);

let KEYWORDS = new Set([
  "in",
  "to",
  "as",
  "of",
  "off",
  "on",
  "mod",
  "AND",
  "OR",
  "XOR",
  "NOT",
  "today",
  "now",
  "tomorrow",
  "yesterday",
  "sum",
  "total",
  "avg",
  "average",
  "prev",
  "previous",
  "count",
  "hex",
  "binary",
  "bin",
  "octal",
  "oct",
  "decimal",
  "dec",
]);

interface IlumiState {
  inComment: boolean;
}

function createParser(): StreamParser<IlumiState> {
  return {
    startState(): IlumiState {
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
        if (FUNCTIONS.has(word)) return "variableName.function";
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
}

const languageCompartment = new Compartment();

/** Reconfigurable language extension. */
export const numiLanguage: Extension = languageCompartment.of(
  StreamLanguage.define(createParser()),
);

/** Update the dynamic sets and reconfigure the language. */
export function updateLanguageSets(
  view: EditorView,
  entities: Array<{ name: string; type: string }>,
): void {
  const newFunctions = new Set<string>();
  const newConstants = new Set<string>();

  for (const e of entities) {
    if (e.type === "function") newFunctions.add(e.name);
    else if (e.type === "constant") newConstants.add(e.name);
  }

  // Merge dynamic entities into default keyword set
  const newKeywords = new Set([
    "in",
    "to",
    "as",
    "of",
    "off",
    "on",
    "mod",
    "AND",
    "OR",
    "XOR",
    "NOT",
  ]);
  for (const e of entities) {
    if (e.type === "lineRef" || e.type === "dateLiteral" || e.type === "baseConversion") {
      newKeywords.add(e.name);
    }
  }

  // Only reconfigure if sets actually changed
  if (
    setsEqual(FUNCTIONS, newFunctions) &&
    setsEqual(CONSTANTS, newConstants) &&
    setsEqual(KEYWORDS, newKeywords)
  ) {
    return;
  }

  FUNCTIONS = newFunctions;
  CONSTANTS = newConstants;
  KEYWORDS = newKeywords;

  view.dispatch({
    effects: languageCompartment.reconfigure(StreamLanguage.define(createParser())),
  });
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}
