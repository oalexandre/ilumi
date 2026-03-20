import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import peggy from "peggy";

import type { ASTNode } from "../ast.js";

const grammarPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "arithmetic.pegjs",
);
const grammarSource = readFileSync(grammarPath, "utf-8");
const parser = peggy.generate(grammarSource);

export interface ParseOptions {
  knownUnits?: Set<string>;
}

export function parse(input: string, options?: ParseOptions): ASTNode {
  return parser.parse(input, options) as ASTNode;
}
