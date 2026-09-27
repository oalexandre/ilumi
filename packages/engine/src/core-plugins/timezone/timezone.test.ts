import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { evaluate } from "../../index.js";

import { timezonePlugin } from "./index.js";

const SUMMER = new Date("2026-07-15T15:30:00Z");
const WINTER = new Date("2026-01-15T15:30:00Z");

/** Newer ICU versions put a narrow no-break space before AM/PM; normalise it. */
function plain(text: string | undefined): string | undefined {
  return text?.replace(/[  ]/g, " ");
}

function formattedAt(when: Date, input: string): (string | undefined)[] {
  vi.setSystemTime(when);
  return evaluate(input).map((r) => plain(r.formatted));
}

function formatter(keyword: string): (n: number) => string {
  const entry = timezonePlugin.baseConversions?.[keyword];
  if (!entry) throw new Error(`no timezone keyword "${keyword}"`);
  return (n) => plain(entry.formatter(n)) ?? "";
}

describe("timezone plugin output", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("formats now in UTC", () => {
    expect(formattedAt(SUMMER, "now in UTC")).toEqual(["Wed, Jul 15, 2026, 3:30 PM UTC"]);
    expect(formattedAt(WINTER, "now in UTC")).toEqual(["Thu, Jan 15, 2026, 3:30 PM UTC"]);
  });

  it("follows daylight saving time in New York (EDT in July, EST in January)", () => {
    expect(formattedAt(SUMMER, "now in New_York")).toEqual(["Wed, Jul 15, 2026, 11:30 AM EDT"]);
    expect(formattedAt(WINTER, "now in New_York")).toEqual(["Thu, Jan 15, 2026, 10:30 AM EST"]);
  });

  it("maps the EST abbreviation to the New York zone, so it also observes DST", () => {
    expect(formattedAt(SUMMER, "now in EST")).toEqual(["Wed, Jul 15, 2026, 11:30 AM EDT"]);
    expect(formattedAt(WINTER, "now in EST")).toEqual(["Thu, Jan 15, 2026, 10:30 AM EST"]);
  });

  it("keeps Sao Paulo at UTC-3 all year (no DST since 2019)", () => {
    expect(formattedAt(SUMMER, "now in Sao_Paulo\nnow in BRT")).toEqual([
      "Wed, Jul 15, 2026, 12:30 PM GMT-3",
      "Wed, Jul 15, 2026, 12:30 PM GMT-3",
    ]);
    expect(formattedAt(WINTER, "now in Sao_Paulo")).toEqual(["Thu, Jan 15, 2026, 12:30 PM GMT-3"]);
  });

  it("rolls over to the next calendar day for zones ahead of UTC", () => {
    expect(formattedAt(SUMMER, "now in Tokyo")).toEqual(["Thu, Jul 16, 2026, 12:30 AM GMT+9"]);
    expect(formattedAt(SUMMER, "now in Sydney")).toEqual(["Thu, Jul 16, 2026, 1:30 AM GMT+10"]);
    expect(formattedAt(WINTER, "now in Sydney")).toEqual(["Fri, Jan 16, 2026, 2:30 AM GMT+11"]);
  });

  it("accepts lowercase city names", () => {
    expect(formattedAt(WINTER, "now in new_york\nnow in tokyo")).toEqual([
      "Thu, Jan 15, 2026, 10:30 AM EST",
      "Fri, Jan 16, 2026, 12:30 AM GMT+9",
    ]);
  });

  it("keeps the timestamp as the value and supports date arithmetic before converting", () => {
    vi.setSystemTime(WINTER);
    const [now, later] = evaluate("now in UTC\nnow + 1 day in UTC");
    expect(now?.value).toBe(WINTER.getTime());
    expect(later?.value).toBe(WINTER.getTime() + 24 * 60 * 60 * 1000);
    expect(plain(later?.formatted)).toBe("Fri, Jan 16, 2026, 3:30 PM UTC");
  });
});

describe("timezone plugin manifest", () => {
  it("formats timestamps directly through the registered formatters", () => {
    expect(formatter("UTC")(0)).toBe("Thu, Jan 1, 1970, 12:00 AM UTC");
    expect(formatter("utc")(0)).toBe("Thu, Jan 1, 1970, 12:00 AM UTC");
    expect(formatter("London")(SUMMER.getTime())).toBe("Wed, Jul 15, 2026, 4:30 PM GMT+1");
    expect(formatter("London")(WINTER.getTime())).toBe("Thu, Jan 15, 2026, 3:30 PM GMT");
  });

  it("registers every entry in the date category with its IANA zone as detail", () => {
    const conversions = timezonePlugin.baseConversions ?? {};
    expect(conversions["PST"]?.detail).toBe("timezone: America/Los_Angeles");
    expect(conversions["pst"]?.detail).toBe("timezone: America/Los_Angeles");
    expect(conversions["Port_au_Prince"]?.detail).toBe("timezone: America/Port-au-Prince");
    expect(Object.values(conversions).every((c) => c.category === "date")).toBe(true);
  });
});
