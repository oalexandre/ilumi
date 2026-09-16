import type { ASTNode } from "./ast.js";
import { EvalContext } from "./evaluator/context.js";
import { evaluateNodeFull } from "./evaluator/index.js";
import type { EvalOptions } from "./evaluator/index.js";
import { formatDate, formatNumber, formatWithUnit } from "./formatter.js";
import type { FormatOptions } from "./formatter.js";
import { parse } from "./parser/index.js";
import type { ParseOptions } from "./parser/index.js";
import type { EntityRegistry } from "./registry/entity-registry.js";
import type { LineResultEntry } from "./core-plugins/types.js";
import type { CurrencyRateStatus } from "./currency/fetcher.js";

import type { LineResult } from "./index.js";

/** Base conversions and timezone formatters use the __fmt__ prefix. */
const FMT_PREFIX = "__fmt__";

interface LineState {
  source: string;
  ast: ASTNode | null;
  result: LineResult;
  defines?: string;
  references: Set<string>;
}

function collectVariableRefs(node: ASTNode): Set<string> {
  const refs = new Set<string>();

  function walk(n: ASTNode): void {
    switch (n.type) {
      case "variable":
        refs.add(n.name);
        break;
      case "binary":
        walk(n.left);
        walk(n.right);
        break;
      case "unary":
        walk(n.value);
        break;
      case "assignment":
        walk(n.value);
        break;
      case "call":
        n.args.forEach(walk);
        break;
      case "percent":
        walk(n.value);
        break;
      case "percentOp":
        walk(n.base);
        walk(n.target);
        break;
      case "conversion":
        walk(n.value);
        break;
      case "expressionWithUnit":
        walk(n.expression);
        break;
      case "number":
      case "numberWithUnit":
      case "date":
      case "lineRef":
      case "comment":
      case "empty":
        break;
    }
  }

  walk(node);
  return refs;
}

/** Every unit phrase mentioned by a line (literals, expression units and conversion targets). */
function collectUnitPhrases(node: ASTNode): string[] {
  const units: string[] = [];

  function walk(n: ASTNode): void {
    switch (n.type) {
      case "numberWithUnit":
        units.push(n.unit);
        break;
      case "expressionWithUnit":
        units.push(n.unit);
        walk(n.expression);
        break;
      case "conversion":
        units.push(n.targetUnit);
        walk(n.value);
        break;
      case "binary":
        walk(n.left);
        walk(n.right);
        break;
      case "unary":
        walk(n.value);
        break;
      case "assignment":
        walk(n.value);
        break;
      case "call":
        n.args.forEach(walk);
        break;
      case "percent":
        walk(n.value);
        break;
      case "percentOp":
        walk(n.base);
        walk(n.target);
        break;
      case "variable":
      case "number":
      case "date":
      case "lineRef":
      case "comment":
      case "empty":
        break;
    }
  }

  walk(node);
  return units;
}

/** Cached rates older than this are flagged as possibly outdated. */
const STALE_RATES_MS = 24 * 60 * 60 * 1000;

export class Document {
  private lines: LineState[] = [];
  private context = new EvalContext();
  private entityRegistry?: EntityRegistry;
  private parseOptions: ParseOptions = {};
  private formatOptions: FormatOptions = {};
  private currencyRateStatus: CurrencyRateStatus | null = null;

  constructor(entityRegistry?: EntityRegistry) {
    this.entityRegistry = entityRegistry;
    if (entityRegistry) {
      this.rebuildParseOptions();
    }
  }

  /** Change how results are formatted. Takes effect on the next update(). */
  setFormatOptions(options: FormatOptions): void {
    this.formatOptions = { ...options };
  }

  /** Tell the document where exchange rates come from, so currency results can carry a warning. */
  setCurrencyRateStatus(status: CurrencyRateStatus | null): void {
    this.currencyRateStatus = status;
  }

  /** Warning for a line whose value depends on exchange rates, or undefined when the rates are trustworthy. */
  private currencyWarning(ast: ASTNode, resultUnit: string | undefined): string | undefined {
    const status = this.currencyRateStatus;
    if (!status || !this.entityRegistry) return undefined;
    if (status.source === "cache" && Date.now() - status.timestamp < STALE_RATES_MS)
      return undefined;

    const unitReg = this.entityRegistry.getUnitRegistry();
    const phrases = collectUnitPhrases(ast);
    if (resultUnit) phrases.push(resultUnit);
    const usesCurrency = phrases.some((p) => unitReg.findByPhrase(p)?.id.startsWith("currency_"));
    if (!usesCurrency) return undefined;

    if (status.source === "fallback") {
      return "Converted with built-in offline exchange rates. The result may be inaccurate.";
    }
    const when = new Date(status.timestamp).toLocaleString();
    return `Converted with exchange rates cached on ${when}. The result may be outdated.`;
  }

  /** Rebuild parse options from EntityRegistry (call after plugins are loaded). */
  refreshParseOptions(): void {
    this.rebuildParseOptions();
  }

  private rebuildParseOptions(): void {
    if (this.entityRegistry) {
      this.parseOptions = {
        knownUnits: this.entityRegistry.getKnownUnits(),
        knownFunctions: this.entityRegistry.getKnownFunctions(),
        knownConstants: this.entityRegistry.getKnownConstants(),
        knownDateLiterals: this.entityRegistry.getKnownDateLiterals(),
        knownLineRefs: this.entityRegistry.getKnownLineRefs(),
        knownBaseKeywords: this.entityRegistry.getKnownBaseKeywords(),
      };
    }
  }

  getResults(): LineResult[] {
    return this.lines.map((l) => l.result);
  }

  update(source: string): LineResult[] {
    const newLines = source.split("\n");
    const dirty = new Set<number>();

    for (let i = 0; i < newLines.length; i++) {
      const newSource = newLines[i] ?? "";
      const existing = this.lines[i];
      if (!existing || existing.source !== newSource) {
        dirty.add(i);
      }
    }

    if (newLines.length !== this.lines.length) {
      for (let i = newLines.length; i < this.lines.length; i++) {
        dirty.add(i);
      }
    }

    this.lines.length = newLines.length;

    for (const i of dirty) {
      const src = newLines[i] ?? "";
      try {
        const ast = parse(src, this.parseOptions);
        this.lines[i] = {
          source: src,
          ast,
          result: { line: i, value: null, formatted: "" },
          defines: ast.type === "assignment" ? ast.name : undefined,
          references: collectVariableRefs(ast),
        };
      } catch {
        this.lines[i] = {
          source: src,
          ast: null,
          result: {
            line: i,
            value: null,
            formatted: "",
            error: "Syntax error",
            errorKind: "syntax",
          },
          references: new Set(),
        };
      }
    }

    const changedVars = new Set<string>();
    for (const i of dirty) {
      const line = this.lines[i];
      if (line?.defines) {
        changedVars.add(line.defines);
      }
    }

    if (changedVars.size > 0) {
      for (let i = 0; i < this.lines.length; i++) {
        if (!dirty.has(i)) {
          const line = this.lines[i];
          if (line) {
            for (const ref of line.references) {
              if (changedVars.has(ref)) {
                dirty.add(i);
                break;
              }
            }
          }
        }
      }
    }

    const previousResults: (LineResultEntry | null)[] = new Array(this.lines.length).fill(null);

    this.context.clear();
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      if (!line || !line.ast) continue;

      const evalOpts: EvalOptions = {
        entityRegistry: this.entityRegistry,
        previousResults,
        currentLine: i,
      };

      try {
        const result = evaluateNodeFull(line.ast, this.context, evalOpts);
        let formatted = "";
        if (result.value !== null) {
          if (result.unit?.startsWith(FMT_PREFIX)) {
            formatted = result.unit.slice(FMT_PREFIX.length);
          } else if (result.unit === "__date__") {
            formatted = formatDate(new Date(result.value));
          } else if (result.unit) {
            formatted = formatWithUnit(result.value, result.unit, this.formatOptions);
          } else {
            formatted = formatNumber(result.value, this.formatOptions);
          }
        }
        const warning =
          result.value !== null ? this.currencyWarning(line.ast, result.unit) : undefined;
        line.result = {
          line: i,
          value: result.value,
          formatted,
          ...(warning ? { warning } : {}),
        };
        previousResults[i] =
          result.value !== null ? { value: result.value, isPercent: result.isPercent } : null;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        line.result = {
          line: i,
          value: null,
          formatted: "",
          error: message,
          errorKind: "eval",
        };
      }
    }

    return this.getResults();
  }
}
