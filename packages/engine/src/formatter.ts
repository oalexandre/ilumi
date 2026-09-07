const MAX_DECIMALS = 10;

export interface FormatOptions {
  /** BCP 47 locale that decides the decimal and thousands separators. Default "en-US". */
  locale?: string;
  /** Upper bound on decimal places. Default: as many as the value needs, up to 10. */
  maxDecimals?: number;
  /** Whether to group thousands. Default true. */
  useGrouping?: boolean;
}

export function formatNumber(value: number, options: FormatOptions = {}): string {
  const locale = options.locale ?? "en-US";

  if (!Number.isFinite(value)) {
    if (Number.isNaN(value)) return "NaN";
    return value > 0 ? "Infinity" : "-Infinity";
  }

  // Determine appropriate decimal places
  let decimals = getSmartDecimals(value);
  if (options.maxDecimals !== undefined) {
    decimals = Math.min(decimals, Math.max(0, Math.min(MAX_DECIMALS, options.maxDecimals)));
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
    useGrouping: options.useGrouping ?? true,
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

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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
