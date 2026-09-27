import type { TranscriptLine } from "@/lib/scenes";

// Mirrors the app's dark syntax theme closely enough that the text reads as the same note
// as the clip beside it. Not a parser: unknown words fall back to the variable colour.
const KEYWORDS = new Set([
  "in", "of", "off", "on", "to", "as",
  "sum", "total", "avg", "average", "prev", "previous", "count",
  "today", "now", "tomorrow", "yesterday",
  "OR", "AND", "XOR", "NOT", "mod", "pi",
]);
const FUNCTIONS = new Set(["round", "sqrt", "cbrt", "abs", "ceil", "floor", "min", "max", "log", "ln", "sin", "cos", "tan"]);
// Time zones render like keywords in the app ("now in Tokyo").
const PLACES = new Set(["Tokyo", "New_York", "Sao_Paulo", "London", "UTC"]);

const TOKEN = /\/\/.*|0x[0-9a-fA-F]+|0b[01]+|\d+(?:\.\d+)?|[A-Za-z_°][\w°]*|<<|>>|[=+\-*/%^()<>,]|\s+|./g;

function classify(token: string): string | undefined {
  if (token.startsWith("//")) return "tok-comment";
  if (/^\s+$/.test(token)) return undefined;
  if (/^(0x|0b|\d)/.test(token)) return "tok-number";
  if (KEYWORDS.has(token) || PLACES.has(token)) return "tok-keyword";
  if (FUNCTIONS.has(token)) return "tok-function";
  if (/^[A-Za-z_°]/.test(token)) return "tok-variable";
  return "tok-operator";
}

function Highlighted({ source }: { source: string }) {
  return (
    <>
      {Array.from(source.matchAll(TOKEN), ([token], i) => {
        const kind = classify(token);
        return kind ? (
          <span key={i} className={kind}>
            {token}
          </span>
        ) : (
          token
        );
      })}
    </>
  );
}

/** A note's lines as text, laid out like the app: input on the left, result on the right. */
export function Transcript({
  lines,
  label,
  moment,
  compact = false,
}: {
  lines: TranscriptLine[];
  label: string;
  /** Index of the line the note builds up to. */
  moment?: number;
  compact?: boolean;
}) {
  return (
    <dl className={`transcript${compact ? " is-compact" : ""}`} aria-label={label}>
      {lines.map((line, i) => (
        <div key={i} className={`transcript-row${i === moment ? " is-moment" : ""}`}>
          <dt>
            <Highlighted source={line.input} />
          </dt>
          <dd>{line.result}</dd>
        </div>
      ))}
    </dl>
  );
}
