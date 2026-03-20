import type { UnitRegistry } from "../units/registry.js";

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const MS_PER_WEEK = 7 * MS_PER_DAY;
const MS_PER_MONTH = 30.4375 * MS_PER_DAY; // average
const MS_PER_YEAR = 365.25 * MS_PER_DAY;

export function registerDurationUnits(registry: UnitRegistry): void {
  const units = [
    { id: "millisecond", phrases: "millisecond, milliseconds, ms", format: "ms", ratio: 1 },
    { id: "second", phrases: "second, seconds, sec, secs", format: "sec", ratio: MS_PER_SECOND },
    { id: "minute", phrases: "minute, minutes, min, mins", format: "min", ratio: MS_PER_MINUTE },
    { id: "hour", phrases: "hour, hours, hr, hrs", format: "hr", ratio: MS_PER_HOUR },
    { id: "day", phrases: "day, days", format: "days", ratio: MS_PER_DAY },
    { id: "week", phrases: "week, weeks", format: "weeks", ratio: MS_PER_WEEK },
    { id: "month", phrases: "month, months", format: "months", ratio: MS_PER_MONTH },
    { id: "year", phrases: "year, years", format: "years", ratio: MS_PER_YEAR },
  ];

  for (const unit of units) {
    registry.addUnit({
      id: unit.id,
      phrases: unit.phrases,
      baseUnitId: "millisecond",
      format: unit.format,
      ratio: unit.ratio,
    });
  }
}

export function resolveDateLiteral(keyword: string): Date {
  const now = new Date();
  switch (keyword.toLowerCase()) {
    case "now":
    case "today":
      return now;
    case "tomorrow":
      return new Date(now.getTime() + MS_PER_DAY);
    case "yesterday":
      return new Date(now.getTime() - MS_PER_DAY);
    default:
      throw new Error(`Unknown date literal "${keyword}"`);
  }
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDuration(ms: number): string {
  const abs = Math.abs(ms);
  if (abs >= MS_PER_YEAR) return `${(ms / MS_PER_YEAR).toFixed(1)} years`;
  if (abs >= MS_PER_MONTH) return `${(ms / MS_PER_MONTH).toFixed(1)} months`;
  if (abs >= MS_PER_WEEK) return `${(ms / MS_PER_WEEK).toFixed(1)} weeks`;
  if (abs >= MS_PER_DAY) return `${(ms / MS_PER_DAY).toFixed(1)} days`;
  if (abs >= MS_PER_HOUR) return `${(ms / MS_PER_HOUR).toFixed(1)} hr`;
  if (abs >= MS_PER_MINUTE) return `${(ms / MS_PER_MINUTE).toFixed(1)} min`;
  return `${(ms / MS_PER_SECOND).toFixed(1)} sec`;
}
