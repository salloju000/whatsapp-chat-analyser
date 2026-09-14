# WhatsApp Chat Analyzer

Turn a WhatsApp chat export into readable statistics — message counts, activity patterns, emoji and word usage, and conversation timelines.

## Your chat never leaves your browser

This is the core design constraint, not a marketing line:

- There is **no backend**. The app is static files.
- The app makes **no network requests** after the initial page load. No API calls, no analytics, no telemetry, no error reporting.
- Your chat file is read with the browser's `File` API, parsed in a Web Worker, and held in memory only. It is never uploaded, and never written to disk or `localStorage`.
- Closing or refreshing the tab discards everything.

You can verify this yourself: open DevTools → Network, run an analysis, and confirm zero requests.

## Getting your chat export

Export as **"Without Media"** — media files are not analyzed and only make the export larger.

**Android**
1. Open the chat → ⋮ menu → **More** → **Export chat**
2. Choose **Without media**
3. Save the `.txt` file (or the `.zip`, then unzip it)

**iOS**
1. Open the chat → tap the contact/group name at the top
2. Scroll down → **Export Chat**
3. Choose **Without Media**
4. Save the `.txt` file (or the `.zip`, then unzip it)

WhatsApp often wraps the export in a `.zip`. **Unzip it and upload the `.txt` inside** — the app will tell you if you upload the zip by mistake.

## Supported export formats

The parser auto-detects the format and date order from the file itself:

| | |
|---|---|
| Platforms | Android (`12/03/2024, 14:32 - Name: msg`) and iOS (`[12/03/2024, 14:32:05] Name: msg`) |
| Clock | 24-hour, and 12-hour with `AM`/`PM` or `a.m.`/`p.m.` (including the narrow no-break space newer exports use) |
| Date order | `DD/MM` and `MM/DD`, inferred by scanning the whole file; `DD/MM` when genuinely ambiguous |
| Separators | `/`, `.`, and `-` |
| Years | 2-digit and 4-digit |
| Also handled | Multi-line messages, system/notification messages, deleted messages, media placeholders, right-to-left and direction marks, CRLF line endings |

System messages ("Alice added Bob", "Bob left", the encryption notice) are detected and excluded from per-person statistics rather than being attributed to whoever spoke last.

## Running locally

Requires Node 20.19+ or 22.12+.

```bash
npm install
npm run dev      # start the dev server
npm run build    # production build to dist/
npm run preview  # serve the production build
npm test         # run the test suite
```

## Tech

Vite 5, React 18, Tailwind CSS 3, Recharts 3, Vitest. No backend, no database, no accounts.
