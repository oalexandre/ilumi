# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences, weighted equally:

- **Everyday users** doing household and personal math: shopping lists, budgets, splitting bills, discounts and taxes, "how many days until", unit and currency conversions.
- **Developers and designers** who keep a scratchpad open while working: hex/binary and bitwise, CSS `px`↔`rem`, timezones, data sizes, quick formulas with variables.

Both arrive from search or from the GitHub repository, and are deciding whether to download a desktop app.

## Product Purpose

The site (ilumi.oalexandre.com.br) exists to get visitors to download Ilumi for their OS. Ilumi is a notepad-style calculator: you type calculations line by line in plain text, and each result appears aligned on the right as you type. Success is a visitor understanding in seconds what writing math "as text" looks like, and downloading the right build.

## Positioning

- Free and open source (MIT), for macOS, Windows and Linux.
- Math written as a note, not a keypad: variables, `sum` of the lines above, percentages as people say them (`10% off 50`, `price + 8%`), units and currencies in the same line (`5 km in miles`, `100 usd in brl`), dates (`today + 2 weeks`, `tomorrow - today in hours`).
- Always one keystroke away: a global shortcut shows or hides it from any app.
- Extensible with plugins (custom units and functions).

## Operating Context

- Desktop app (Electron) with tabs for multiple notes, autosave, dark and light themes.
- Distributed through GitHub Releases. The macOS build is not signed with an Apple Developer ID yet, so the site must keep telling Mac users how to open it (`xattr -cr`).
- The site is a Next.js static export deployed on Vercel from `master`. Download links point at the assets of a specific release and are bumped only after that release is published.

## Capabilities and Constraints

Confirmed features (see the repo README for the full list): variables; line references `sum`/`total`, `avg`, `prev`, `count`; percentages; 200+ units in 10 categories including CSS; live currency rates with offline fallback; date arithmetic and date differences in days; number bases and bitwise operators; math functions and constants; 400+ IANA timezones; multiple notes; plugins; global shortcut and always-on-top; number formats (`1,234.56`, `1.234,56`, `1 234,56`); share a note as an image; line wrapping with aligned results.

- The app UI is in English. Input uses `.` as the decimal separator; only the output format is configurable.
- Portuguese keywords in the engine (`hoje`, `15% de 250`) do not exist yet and must not be shown.

## Brand Commitments

- Name **Ilumi**, logo at `website/public/logo.svg`, the "il" accent / "umi" dim wordmark in a mono font.
- Keep the incumbent identity: dark background, gold accent, monospace for anything the user types. A refresh, not a rebrand.
- Voice: plain, friendly, concrete; show real expressions instead of describing them.

## Evidence on Hand

- The app itself: real screenshots and recordings can be produced from the built app (`e2e/demo.ts` already records a demo).
- `demo.gif` at the repo root (older recording).
- No testimonials, user counts, download numbers, press or GitHub-star figures are to be shown. Do not fabricate any.
- License: MIT (copyright notice by Dmitry Nikolaev, 2018, in `license.txt`); the site may say "open source, MIT".

## Product Principles

1. Show, don't tell: every claim is backed by a real expression and its real result from the app.
2. Both audiences see themselves within the first scroll: one everyday example, one technical example.
3. Downloading must be obvious and correct for the visitor's OS.
4. Honest about rough edges (unsigned macOS build) instead of hiding them.

## Accessibility & Inclusion

Site available in English (default) and Brazilian Portuguese. Animated demos must not be the only way to understand a feature and must respect reduced-motion preferences.
