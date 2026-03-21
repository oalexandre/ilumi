import type { UnitDefinition } from "../units/registry.js";

export type MathFn = (...args: number[]) => number;

export interface LineRefContext {
  previousResults: (number | null)[];
  currentLine: number;
}

export type LineRefHandler = (ctx: LineRefContext) => number;

/** Declarative test case for plugin self-validation. */
export interface PluginTest {
  /** Human-readable description of what is being tested */
  description: string;
  /** Expression to evaluate (may contain newlines for multi-line tests) */
  input: string;
  /** Which result line to check (default: 0, or last line if negative) */
  line?: number;
  /** Expected numeric value (use null for lines that should produce no value) */
  expected?: number | null;
  /** Expected formatted output string */
  formatted?: string;
  /** Tolerance for approximate numeric comparisons (default: exact match) */
  tolerance?: number;
}

export interface PluginManifest {
  id: string;
  name: string;
  description?: string;
  functions?: Record<string, { fn: MathFn; detail?: string }>;
  constants?: Record<string, { value: number; detail?: string }>;
  units?: UnitDefinition[];
  lineRefs?: Record<string, { handler: LineRefHandler; detail?: string }>;
  dateLiterals?: Record<string, { resolver: () => Date; detail?: string }>;
  baseConversions?: Record<
    string,
    {
      formatter: (n: number) => string;
      detail?: string;
      aliases?: string[];
      /** Category for autocomplete filtering (e.g., "date", "numeric"). Omit for universal. */
      category?: string;
    }
  >;
  /** Self-test cases — evaluated by the test runner to validate the plugin works correctly */
  tests?: PluginTest[];
  /** Help sections displayed in the help panel */
  help?: HelpSection[];
}

/** A help section that appears in the help panel. */
export interface HelpSection {
  title: string;
  description?: string;
  examples: HelpExample[];
}

export interface HelpExample {
  input: string;
  output: string;
  desc?: string;
}
