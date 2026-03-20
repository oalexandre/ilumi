const MAX_DECIMALS = 10;

export interface FormatOptions {
  locale?: string;
}

export function formatNumber(value: number, options: FormatOptions = {}): string {
  const locale = options.locale ?? "en-US";

  if (!Number.isFinite(value)) {
    if (Number.isNaN(value)) return "NaN";
    return value > 0 ? "Infinity" : "-Infinity";
  }

  // Determine appropriate decimal places
  const decimals = getSmartDecimals(value);

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
    useGrouping: true,
  }).format(value);
}

export function formatWithUnit(
  value: number,
  unit: string | undefined,
  options: FormatOptions = {},
): string {
  const formatted = formatNumber(value, options);
  if (!unit) return formatted;
  return `${formatted} ${unit}`;
}

function getSmartDecimals(value: number): number {
  if (Number.isInteger(value)) return 0;

  // Convert to string and count significant decimals
  const str = value.toPrecision(15);
  const dotIndex = str.indexOf(".");
  if (dotIndex === -1) return 0;

  // Trim trailing zeros
  const decimals = str.slice(dotIndex + 1).replace(/0+$/, "");
  return Math.min(decimals.length, MAX_DECIMALS);
}
