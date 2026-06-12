# FindMyCar — Vision Concept

A standalone visual concept prototype imagining where **FindMyCar** could go next:
a cinematic, motion-rich, editorial take on car discovery. This is a design and
interaction exploration — **not** a build of the real product.

> This folder is completely self-contained and isolated from the production
> FindMyCar app (the Next.js project at the repo root). Nothing here is imported
> by, linked from, or able to affect `app/`, `lib/`, or `public/`. It is plain
> HTML/CSS/JS with no build step, no dependencies, and no backend.

## What this is

- A front-end **visual and motion showcase** — strong art direction, premium
  type pairing, scroll-driven reveals, layered parallax, glass/glow surfaces,
  animated counters, a drag-to-compare module, a simulated "AI search" sequence,
  and a cinematic horizontal "discovery journeys" gallery.
- Built around **mocked content only**: invented listings, prices, specs,
  match scores and "live activity" — clearly illustrative, never wired to any
  API, database, auth, or persistence layer.
- A reference point for how the existing brand DNA (warm near-black surfaces,
  amber/bronze metal gradient, Fraunces + Inter Tight type pairing, grain
  texture, glow orbs) could be pushed further: richer palette, bolder rhythm,
  more "alive" interaction.

## What this is **not**

- Not a refactor or reskin of the production app — no existing files were
  changed.
- Not connected to Supabase, AutoScout, or any other live data source.
- Not a working search, filter, comparison, auth, or save/shortlist feature —
  every interaction you see (search "thinking", match percentages, the compare
  slider, the newsletter capture, the "live" ticker) is a scripted, looping
  simulation over fixed mock data.

## Running it locally

No install, no build, no server required — it's static HTML/CSS/JS.

**Option 1 — just open it**

Double-click [`index.html`](index.html), or open it directly in a browser:

```
file:///C:/Users/Lenovo/findmycar/findmycar-vision/index.html
```

**Option 2 — serve it (recommended for the smoothest experience)**

Some browsers throttle animations/fonts slightly differently for `file://`
pages. If you want the truest preview, serve the folder with any static
server, e.g. from this directory:

```bash
npx serve .
# or
python -m http.server 5500
```

Then open the printed `localhost` URL.

## Structure

```
findmycar-vision/
├── index.html      All markup + mock content for every section
├── styles.css      Design tokens, base styles, components, layouts, motion
├── script.js       All interactions (scroll reveals, cursor, parallax,
│                   counters, search/compare/journey demos, marquees, etc.)
└── README.md       This file
```

## Notes for whoever picks this up next

- Respects `prefers-reduced-motion`: heavy motion (cursor follower, parallax,
  marquees, scripted search demo) is disabled or reduced automatically.
- Everything is keyboard- and touch-reachable: the compare slider, the
  horizontal journeys gallery, and the nav all work without a mouse.
- All copy, prices, specs, locations and "live" events are invented for this
  concept and should not be treated as real FindMyCar data, claims or figures.
