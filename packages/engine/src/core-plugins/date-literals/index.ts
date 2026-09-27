import type { PluginManifest } from "../types.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const dateLiteralsPlugin: PluginManifest = {
  id: "core.date-literals",
  name: "Date Literals",
  description: "Date keywords: today, now, tomorrow, yesterday",
  tests: [
    {
      description: "today returns a timestamp > 0",
      input: "today",
      expected: Date.now(),
      tolerance: 60000,
    },
    {
      description: "now returns a timestamp > 0",
      input: "now",
      expected: Date.now(),
      tolerance: 60000,
    },
    { description: "tomorrow - today = 1 day", input: "tomorrow - today", expected: 1 },
    { description: "today - yesterday = 1 day", input: "today - yesterday", expected: 1 },
  ],
  dateLiterals: {
    today: { resolver: () => new Date(), detail: "current date" },
    now: { resolver: () => new Date(), detail: "current date/time" },
    tomorrow: {
      resolver: () => new Date(Date.now() + MS_PER_DAY),
      detail: "tomorrow's date",
    },
    yesterday: {
      resolver: () => new Date(Date.now() - MS_PER_DAY),
      detail: "yesterday's date",
    },
  },
  help: [
    {
      title: "Dates",
      description: "Date arithmetic with today, now, tomorrow, yesterday.",
      examples: [
        { input: "today", output: "current date" },
        { input: "today + 2 weeks", output: "date" },
        { input: "tomorrow - 1 day", output: "today's date" },
      ],
    },
  ],
};
