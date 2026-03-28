export class SyntaxError extends Error {
  expected: unknown[];
  found: string | null;
  location: unknown;
}

export const StartRules: string[];

export function parse(input: string, options?: object): unknown;
