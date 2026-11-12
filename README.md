# FODX Coach

Free, offline, no-signup tool for gym coaches: add clients, build programs, export a branded PDF for WhatsApp.
React 18 + TypeScript + Vite + Tailwind v4. Data lives in the browser (IndexedDB). FR / AR (RTL) / EN.

## Run it (Windows CMD)

```
npm install
npm run dev
```

Open the URL Vite prints. Other commands:

```
npm run build      (typecheck + production build into dist/)
npm run preview    (serve the production build, PWA included)
npm test           (smoke test of the main flow)
npm run sample     (writes sample PDFs to sample-output/, no browser needed)
```

## Deploy (Cloudflare Pages, free, commercial use OK)

1. Push the repo to GitHub.
2. Cloudflare dashboard > Workers & Pages > Create > Pages > Connect to Git.
3. Build command `npm run build`, output directory `dist`, env var `NODE_VERSION=22`.

HashRouter is used on purpose: deep links work without server rewrites on any host.

## Features worth knowing

- Timed exercises (plank, cardio, stretching...): per exercise "Reps | Time" toggle, duration in s/min, PDF shows "10 min" / "45 s".
- Smart defaults: each library exercise has default sets/reps/duration/rest; a new reps row copies the previous reps row.
- Generate for me: pick days/week, goal and level, get a full split (full body, push/pull/legs, upper/lower) built from your library.
- Generate weeks: from one good week, auto-add harder weeks (+reps, +sets every N weeks, less rest, longer holds, optional deload week).
- Supersets (1, 2a, 2b), optional Load/RPE column, estimated session length, weekly volume per muscle, undo (button or Ctrl+Z).
- Export: PDF (download or share sheet) plus a WhatsApp-formatted text version (copy or open WhatsApp).
- Optional Instagram QR code at the end of the PDF (Settings).

## How it is organised

```
src/
  app/          shell, routes, smoke test
  features/     clients, programs (builder, picker, export), library, templates, settings
  pdf/          ProgramPdf.tsx (3 styles, FR/AR/EN/bilingual), fonts, labels, render.tsx (lazy)
  store/        zustand store, IndexedDB persistence (debounced), zod backup schema
  i18n/         dict.ts (fr, en, ar), useT(), <html dir/lang> sync
  data/         seed exercise library (about 70, 3 languages)
  lib/          clone (new ids), color, image resize, download
public/fonts/   static IBM Plex Sans Arabic TTFs used inside PDFs
scripts/        sample.tsx
```

Key decisions:
- Template = a program with `isTemplate: true`. One builder, one PDF path. Copying a template or duplicating a day/week is the same deep clone with fresh ids.
- `reps` is a string ("8-10", "AMRAP"). Rest is seconds or empty.
- Exercises are referenced by id. Renaming one updates old programs; deleting archives it.
- PDF language is per program (`fr`, `ar`, `en`, `bilingual`), independent of the app language.
- The PDF engine is a separate lazy chunk, only downloaded on first export.
- Arabic uses one font family that covers Arabic and Latin so mixed lines stay consistent. If an Arabic edge case ever breaks in react-pdf, the fallback plan is rendering HTML to an image and wrapping it in a PDF. Everything goes through `renderProgramPdf()` so swapping is a one-file change.

## Known limits

- Arabic exercise names in the seed library are a starting point. Have coaches review them (MSA vs Darija vs French loanwords).
- Data is local to one browser. iOS Safari can clear site data for sites that are not installed; Settings has a "protect my data" button and JSON backup.
- Session length is a rough estimate (3 s per rep + rest + 45 s setup per exercise).
- Reorder uses up/down buttons (works well on phones). Drag and drop can come later.
