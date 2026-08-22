---
name: "horo-admin-conventions"
description: "Use when writing, reviewing, or extending anything in the horo-horo-admin SvelteKit back-office — routes, components, the API client, types, or strings. Covers Svelte 5 runes usage, the strict rule that user-facing copy lives in strings.ts and never inline, the api.ts request wrapper and its global 401-to-login redirect, the app.css utility-class system that replaces ad-hoc Tailwind, how the staging API URL is selected at build time via VITE_API_URL, chart and data-visualization conventions for the dashboards, and the verify loop (svelte-check, npm run build) before a change is done. Trigger for any work under src/ in this repo — adding an admin screen, a table, a filter, a chart, or an API call — and whenever an admin page needs to display or edit values the mobile app reads."
---

# horo-horo-admin — SvelteKit back-office conventions

SvelteKit 2 + Svelte 5 (runes) + Tailwind 4, built with `adapter-static` and
served from Firebase Hosting. `src/routes/+layout.ts` sets `ssr = false` — this
is a **single-page app**, so every route is client-rendered and Firebase rewrites
`**` to `/index.html`. New routes need no prerender config.

Only one runtime dependency (`lucide-svelte`). Reach for a library last: the
payments charts are hand-written SVG rather than a charting package, and the
whole dashboard is ~200 lines because of it.

## 1. Layout

```
src/lib/api.ts             every backend call, one per endpoint
src/lib/types.ts           TypeScript mirrors of the Go model structs
src/lib/strings.ts         ALL user-facing copy
src/lib/format.ts          shared money/count/percent/date formatting
src/lib/auth.svelte.ts     the auth store (a rune-based factory)
src/lib/env.ts             API_BASE_URL from VITE_API_URL
src/lib/components/        shared components
src/routes/(app)/          authenticated screens (sidebar layout)
src/routes/login/          the sign-in screen
src/routes/p/              public pages (hosted legal documents)
```

## 2. Strings live in `strings.ts`

Every label, button, error, column header, and empty-state message is a
constant in `src/lib/strings.ts`, grouped by screen (`PAYMENTS`, `PACKAGES`,
`LOGIN`, `NAV`). Components import the group and read from it.

This is not ceremony — it is what makes a copy review possible without opening
twelve `.svelte` files, and what keeps two screens from calling the same thing
by two names. A hardcoded string in markup is the one thing to flag on sight in
review.

## 3. `api.ts` — one function per endpoint

Every call goes through the private `request<T>()` wrapper, which attaches the
bearer token, sets JSON headers, and throws a typed `ApiError` carrying the
status and the backend's `error` code.

`request()` also handles **session expiry globally**: a 401 clears the auth
store and redirects to `/login?redirectTo=<current path>`, so a token that
expired while someone had a page open sends them to sign in instead of leaving
them clicking through error toasts. Two things that behaviour depends on:

- The credential endpoints (`/auth/login`, `/auth/send-otp`, `/auth/verify-otp`)
  are excluded. Their 401 means "wrong password", which the login screen reports
  itself — sweeping it into a redirect would clobber that message.
- `redirectTo` is **validated as a same-origin path** before use. It arrives in
  the URL, so anyone can put anything there, and a naive `startsWith('/')` check
  waves through `//evil.com`, which is a protocol-relative URL straight off the
  site.

Exported functions take real arguments and return typed results — never a raw
path from a caller. When the backend decides something, don't expose it as a
parameter: the payments endpoints scope to the deployment's own environment, so
`getPaymentSummary` takes a range and nothing else.

## 4. Svelte 5 runes

`$state`, `$derived`, `$derived.by`, `$props` — no `export let`, no legacy
stores in components. `auth.svelte.ts` shows the store pattern: a factory
returning getters over `$state`, exported as a singleton.

- `$derived.by(() => {...})` for anything needing statements rather than one
  expression.
- Event attributes are lowercase (`onclick`, `onchange`), not `on:click`.
- A `{#each}` over rows that get edited or reordered needs a key —
  `{#each rows as r (r.key)}`.
- Editable table rows follow the "draft field" pattern (`draftPrice`,
  `draftTokens`) with a `dirty()` comparison enabling the save button. A field
  with a meaningful empty state must be held as a **string**, not a number:
  `bind:value` on `<input type="number">` coerces, an empty field becomes `NaN`,
  and `NaN !== NaN` leaves the row permanently dirty. Use
  `type="text" inputmode="decimal"` and parse on save.

## 5. Styling — `app.css` utility classes first

`src/app.css` defines a large vocabulary of semantic classes (`card-padded`,
`stat-number`, `table-th`, `btn-primary`, `text-caption`, `badge`,
`empty-list-text`, …). Use them. They are what keeps twelve screens looking like
one product, and they already handle dark mode.

Dark mode is a `.dark` class on `<html>`, so component-scoped CSS targets
`:global(.dark) .thing`. Reach for raw Tailwind only for one-off layout
(`grid`, `gap-5`, `flex`); if you're writing the same combination twice, it
belongs in `app.css`.

## 6. Charts and data display

When building a dashboard, load the `dataviz` skill before writing chart code.
The conventions already established here:

- **One series per chart.** Two measures on different scales get two charts,
  never a second y-axis — a dual-axis chart misleads by construction.
- Single series needs no legend; the card title already names it.
- Label **selectively** — the peak point, not every point. The rest is the
  tooltip's job.
- Hover is expected on any HTML chart: crosshair plus tooltip on a line/area,
  per-mark tooltip on bars.
- Zero-fill gaps server-side so the client never infers a missing bucket.
- Axis ticks round to clean numbers, and an all-zero window still gets a real
  axis — otherwise the empty state collapses onto the baseline with no scale.
- Text wears text tokens, never the series colour.
- Validate any categorical palette rather than eyeballing it; the `dataviz`
  skill bundles a script for this.

`TimeSeriesChart.svelte` and `BreakdownBars.svelte` are the reference
implementations.

## 7. Environments

`API_BASE_URL` comes from `VITE_API_URL` at **build time**, defaulting to
`http://localhost:8080`:

```bash
npm run dev          # against localhost:8080
npm run dev:staging  # against the staging Cloud Run API
npm run build:staging
```

The deploy workflow runs `npm run build:staging`. There is one admin site per
backend environment, each with its own database — production will be a separate
deployment with its own URL, not a toggle inside this one.

The practical consequence: **don't build environment selectors, filters, or
badges.** This site is staging, so everything it can reach is already staging
data. A control with one meaningful value is clutter, and a label saying
"Staging" on a site that is only ever staging tells the reader nothing they
didn't know from the URL. The same reasoning applies to any "which system am I
looking at" affordance — if the deployment answers it, the UI shouldn't ask.

Adding a screen that edits values the mobile app reads? Those live in the
backend's admin-configurable tables. The app must never hardcode a copy, so
prefer widening an admin screen over shipping a constant in Dart.

## 8. Verify before calling it done

```bash
npx svelte-check --tsconfig ./tsconfig.json
npm run build
```

`svelte-check` currently reports pre-existing errors in `routes/(app)/users/`.
Filter to the files you touched rather than assuming a clean run — comparing the
total against a clean checkout is the quick way to tell whether an error is
yours.

`npm run build` matters as its own check: `adapter-static` fails on things
`svelte-check` accepts, so a passing typecheck is not a passing build.
