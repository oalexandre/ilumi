// Numi Calculator — Arithmetic Grammar
// Covers: +, -, *, /, ^, mod, parentheses, unary, numbers, functions, constants, percentages, units, conversions, assignments, variables

{{
function buildBinaryExpr(head, tail) {
  return tail.reduce((left, [, op, , right]) => ({
    type: "binary",
    op,
    left,
    right,
  }), head);
}
}}

{
// Per-parse initializer — has access to `options`
const KNOWN_FUNCTIONS = options.knownFunctions || new Set([
  "sqrt", "cbrt", "abs", "ceil", "floor", "round", "trunc",
  "sin", "cos", "tan", "asin", "acos", "atan",
  "log", "ln", "log2", "log10",
  "exp", "sign",
  "min", "max",
]);

const KNOWN_CONSTANTS = options.knownConstants || new Set(["pi", "e", "tau"]);

const KNOWN_DATE_LITERALS = options.knownDateLiterals || new Set([
  "today", "now", "tomorrow", "yesterday",
]);

const KNOWN_LINE_REFS = options.knownLineRefs || new Set([
  "sum", "total", "average", "avg", "previous", "prev", "count",
]);

const KNOWN_BASE_KEYWORDS = options.knownBaseKeywords || new Set([
  "hexadecimal", "hex", "binary", "bin", "octal", "oct", "decimal", "dec",
]);

// Reserved words that cannot be unit names
const RESERVED = new Set([
  ...KNOWN_FUNCTIONS, ...KNOWN_CONSTANTS,
  "in", "to", "as", "of", "off", "on", "mod",
]);

function isUnit(name) {
  if (RESERVED.has(name.toLowerCase())) return false;
  const units = options && options.knownUnits;
  if (!units) return false;
  return units.has(name.toLowerCase());
}
}

Line
  = Comment / Assignment / Expression / Empty

Comment
  = "//" rest:$(.*)  { return { type: "comment", text: rest.trim() }; }
  / "#" rest:$(.*)   { return { type: "comment", text: rest.trim() }; }

Assignment
  = name:Identifier !{ return KNOWN_CONSTANTS.has(name) || KNOWN_FUNCTIONS.has(name); } _ "=" _ expr:Expression
    { return { type: "assignment", name, value: expr }; }

Empty
  = _  { return { type: "empty" }; }

// === EXPRESSIONS (precedence: low to high) ===

Expression
  = Conversion

Conversion
  = left:BitwiseOr __ ("in" / "to" / "as") __ target:ConversionTarget
    { return { type: "conversion", value: left, targetUnit: target }; }
  / BitwiseOr

ConversionTarget
  = BaseKeyword / UnitName

BaseKeyword
  = kw:$([a-zA-Z_] [a-zA-Z0-9_]*)
    &{ return KNOWN_BASE_KEYWORDS.has(kw); }
    { return kw; }

BitwiseOr
  = head:BitwiseXor tail:(__ ("OR") __ BitwiseXor)*
    { return buildBinaryExpr(head, tail); }

BitwiseXor
  = head:BitwiseAnd tail:(__ ("XOR") __ BitwiseAnd)*
    { return buildBinaryExpr(head, tail); }

BitwiseAnd
  = head:Shift tail:(__ ("AND") __ Shift)*
    { return buildBinaryExpr(head, tail); }

Shift
  = head:Addition tail:(_ ("<<" / ">>") _ Addition)*
    { return buildBinaryExpr(head, tail); }

Addition
  = head:Multiplication tail:(_ ("+" / "-") _ Multiplication)*
    { return buildBinaryExpr(head, tail); }

Multiplication
  = head:Power tail:(_ ("*" / "/" / "mod") _ Power)*
    { return buildBinaryExpr(head, tail); }

Power
  = base:Unary _ "^" _ exp:Power
    { return { type: "binary", op: "^", left: base, right: exp }; }
  / Unary

Unary
  = "NOT" __ expr:Postfix
    { return { type: "unary", op: "NOT", value: expr }; }
  / op:("-" / "+") _ expr:Postfix
    { return { type: "unary", op, value: expr }; }
  / Postfix

Postfix
  = base:Primary _ "%" _ "off" __ target:Primary
    { return { type: "percentOp", op: "off", base, target }; }
  / base:Primary _ "%" _ "on" __ target:Primary
    { return { type: "percentOp", op: "on", base, target }; }
  / base:Primary _ "%" _ "of" __ target:Primary
    { return { type: "percentOp", op: "of", base, target }; }
  / expr:Primary _ "%"
    { return { type: "percent", value: expr }; }
  / Primary

// Conversions ("in" / "to" / "as") are handled only at the top level (see
// Conversion) so that "2 hours + 30 minutes in minutes" converts the whole sum.
Primary
  = FunctionCallParens / FunctionCallSpace / ExpressionWithUnit / ParenExpr / NumberWithUnit / Number / DateLiteral / LineRef / Constant / Variable

NumberWithUnit
  = n:Number __ unit:UnitName
    { return { type: "numberWithUnit", value: n.value, unit }; }

ExpressionWithUnit
  = v:(ParenExpr / Variable) __ unit:UnitName
    { return { type: "expressionWithUnit", expression: v, unit }; }

FunctionCallParens
  = name:FunctionName "(" _ args:ArgList _ ")"
    { return { type: "call", name, args }; }

FunctionCallSpace
  = name:FunctionName __ arg:Primary
    { return { type: "call", name, args: [arg] }; }

ArgList
  = head:Expression tail:(_ "," _ Expression)*
    { return [head, ...tail.map(t => t[3])]; }

FunctionName
  = name:$([a-zA-Z_] [a-zA-Z0-9_]*)
    &{ return KNOWN_FUNCTIONS.has(name); }
    { return name; }

// Longest phrase first, then shorter ones, so "10 km / 2" does not swallow the
// operator into a bogus multi-word unit (PEG cannot backtrack into a greedy "*").
UnitName
  = name:$(NonKeywordWord __ NonKeywordWord __ NonKeywordWord)
    &{ return isUnit(name.replace(/\s+/g, ' ')); }
    { return name.replace(/\s+/g, ' '); }
  / name:$(NonKeywordWord __ NonKeywordWord)
    &{ return isUnit(name.replace(/\s+/g, ' ')); }
    { return name.replace(/\s+/g, ' '); }
  / name:$(NonKeywordWord)
    &{ return isUnit(name); }
    { return name; }

NonKeywordWord
  = word:$([a-zA-Z°²³µ][a-zA-Z0-9°²³µ]*)
    !{ return ["in","to","as","of","off","on","mod"].includes(word.toLowerCase()); }

DateLiteral
  = keyword:$([a-zA-Z_] [a-zA-Z0-9_]*)
    &{ return KNOWN_DATE_LITERALS.has(keyword); }
    { return { type: "date", keyword }; }

LineRef
  = ref:$([a-zA-Z_] [a-zA-Z0-9_]*)
    &{ return KNOWN_LINE_REFS.has(ref); }
    { return { type: "lineRef", ref }; }

Constant
  = name:$([a-zA-Z_] [a-zA-Z0-9_]*)
    &{ return KNOWN_CONSTANTS.has(name); }
    { return { type: "variable", name }; }

ParenExpr
  = "(" _ expr:Expression _ ")"  { return expr; }

// === NUMBERS ===

Number
  = Scientific / Hex / Binary / Float / Integer

Scientific
  = value:$([0-9]+ ("." [0-9]+)? [eE] [+-]? [0-9]+)
    { return { type: "number", value: parseFloat(value) }; }

Hex
  = "0x" digits:$([0-9a-fA-F]+)
    { return { type: "number", value: parseInt(digits, 16) }; }

Binary
  = "0b" digits:$([01]+)
    { return { type: "number", value: parseInt(digits, 2) }; }

Float
  = value:$([0-9]+ "." [0-9]+)
    { return { type: "number", value: parseFloat(value) }; }

Integer
  = value:$([0-9]+)
    { return { type: "number", value: parseInt(value, 10) }; }

// === VARIABLES ===

Variable
  = name:Identifier
    { return { type: "variable", name }; }

Identifier
  = $([a-zA-Z_] [a-zA-Z0-9_]*)

// === WHITESPACE ===
_ = [ \t]*
__ = [ \t]+
