import type { NoteData } from "./notes.js";

/**
 * Content of the note created on a fresh install. Every line evaluates without
 * error so the first screen a user sees is a working tour of the syntax.
 */
export const WELCOME_NOTE_TITLE = "Welcome";

export const WELCOME_NOTE_CONTENT = `// Welcome to Ilumi!
// Type a calculation on each line.
// Results appear on the right.
// Click a result to copy it.
// The ? button opens the reference.

// sum adds up the lines above
coffee = 18.90
bread = 7.50
milk = 5.20
sum

// Variables
rent = 1200
food = 450 + 120
budget = rent + food

// Percentages
20% of budget
budget - 10%
150 + 8%

// Units and conversions
5 km in miles
72 °F in °C
2 hours + 30 minutes in minutes
1 GB in MB

// Currency (rates refresh hourly)
100 usd in brl
50 eur in usd

// Dates
today + 2 weeks
tomorrow

// Other bases
255 in hex
0xFF + 1

// Functions and constants
sqrt(144) * pi
round(10 / 3, 2)
2 ^ 10
prev * 2
`;

export function createWelcomeNote(id: string): NoteData {
  return { id, title: WELCOME_NOTE_TITLE, content: WELCOME_NOTE_CONTENT };
}
