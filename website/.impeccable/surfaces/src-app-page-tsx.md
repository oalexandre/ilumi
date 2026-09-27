---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: []
---

Scope: the Ilumi marketing home page, `/` (English) and `/pt` (Brazilian Portuguese). Mode: Persuade.

Audience and job: everyday users (shopping, budgets, dates) and developers/designers (hex, CSS, timezones), deciding whether to download a desktop app. Action: download the build for their OS. Proof: only real recordings and screenshots of the app; no testimonials or numbers exist. Constraints: static export on Vercel, Lighthouse-ready (video instead of GIF, sized media, lazy loading), hreflang EN/PT, reduced-motion respected, unsigned-macOS note kept.

## Direction contract

THESIS: The page is a tour of real Ilumi notes. Each band is one note being written, ending on its "moment" (the total closes, the timezone lands). It refuses the category default of a centered hero plus icon-tile feature grid.

OWN-WORLD: Incumbent world kept: near-black violet ground #0b0a12, gold #f0b800 as the only accent, result green #a6e3a1, JetBrains Mono for anything typed, Inter for prose. Components: app-window frames with real clips, expression chips (`input → result`) set in mono, hairline gold rules between scenes.

STORY: Visitor sees a note total itself in the first viewport, recognizes their own math in one of the scenes (home or work), learns the syntax is just text, and downloads for their OS.

FIRST VIEWPORT: Left 5/12: logo mark, wordmark, one-line promise, download button with OS detection and the version line. Right 7/12: large app window playing the shopping-list clip ending on `sum`. Primary action visible without scrolling at 1280×720 and 390×844.

FORM: Scenario tour, candidate 3 of my 7 ranked structures; seed key 9ddd0aa0. Signature interaction: each scene's clip plays when it scrolls into view and pauses off-screen; the chips under it replay the exact lines typed.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Accepted exceptions

- Dates scene clip (2026-09-27): its time-zone results are long and the app gives results 40% of the window, so the clip's text is smaller than the other scenes' (about 12px on desktop, unreadable on phones). The user chose to ship it as is; the transcript beside the clip carries the readable text.
