export interface LineResult {
  line: number;
  value: number | null;
  formatted: string;
  error?: string;
}

export function evaluate(document: string): LineResult[] {
  const lines = document.split("\n");
  return lines.map((_, index) => ({
    line: index,
    value: null,
    formatted: "",
  }));
}
