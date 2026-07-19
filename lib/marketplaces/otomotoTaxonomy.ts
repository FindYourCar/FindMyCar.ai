// ── Otomoto.pl taxonomy ────────────────────────────────────────────────────
// Otomoto uses Polish model slugs that do NOT match AutoScout's German ones:
//   BMW 3 Series → seria-3   (NOT 3er / 3-series)
//   Mercedes C-Class → c-klasa  (NOT klasa-c / c-klasse)
// Everything in here was verified against live otomoto.pl result counts using
// the strict-subset test (a real model page returns FEWER offers than its make
// page; a bogus slug silently serves the full make list — see isSoftFallback).
//
// Verified 2026-07: volkswagen 18,826 offers · volkswagen/golf 3,393 (real)
//                   volkswagen/zzzznotreal 18,826 (soft fallback, not a 404)
//                   mercedes-benz 16,587 · c-klasa 2,441 (real) · klasa-c 16,587 (bogus)

/** Makes whose Otomoto slug differs from our internal registry slug. */
const MAKE_SLUG_OVERRIDES: Record<string, string> = {
  // Our registry already uses otomoto-compatible make slugs for the big brands
  // (volkswagen, bmw, audi, mercedes-benz, skoda, opel, ford, toyota…).
  // Overrides land here only when a brand genuinely diverges.
  vw: "volkswagen",
  mercedes: "mercedes-benz",
};

/**
 * Model slug overrides, keyed by `${makeSlug}:${normalizedModel}`.
 * Only brands that genuinely rename models need entries — most brands
 * (golf, octavia, focus, astra, corolla) use the plain lowercase name.
 */
const MODEL_SLUG_OVERRIDES: Record<string, string> = {
  // BMW — numbered ranges become "seria-N"
  "bmw:1": "seria-1",
  "bmw:1-series": "seria-1",
  "bmw:1er": "seria-1",
  "bmw:2": "seria-2",
  "bmw:2-series": "seria-2",
  "bmw:2er": "seria-2",
  "bmw:3": "seria-3",
  "bmw:3-series": "seria-3",
  "bmw:3er": "seria-3",
  "bmw:4": "seria-4",
  "bmw:4-series": "seria-4",
  "bmw:4er": "seria-4",
  "bmw:5": "seria-5",
  "bmw:5-series": "seria-5",
  "bmw:5er": "seria-5",
  "bmw:6": "seria-6",
  "bmw:6-series": "seria-6",
  "bmw:6er": "seria-6",
  "bmw:7": "seria-7",
  "bmw:7-series": "seria-7",
  "bmw:7er": "seria-7",
  "bmw:8": "seria-8",
  "bmw:8-series": "seria-8",
  "bmw:8er": "seria-8",

  // Mercedes-Benz — "X-Class"/"X-Klasse" becomes "x-klasa"
  "mercedes-benz:a-class": "a-klasa",
  "mercedes-benz:a-klasse": "a-klasa",
  "mercedes-benz:b-class": "b-klasa",
  "mercedes-benz:b-klasse": "b-klasa",
  "mercedes-benz:c-class": "c-klasa",
  "mercedes-benz:c-klasse": "c-klasa",
  "mercedes-benz:e-class": "e-klasa",
  "mercedes-benz:e-klasse": "e-klasa",
  "mercedes-benz:s-class": "s-klasa",
  "mercedes-benz:s-klasse": "s-klasa",
  "mercedes-benz:cla": "cla-klasa",
  "mercedes-benz:cls": "cls-klasa",
  "mercedes-benz:gla": "gla-klasa",
  "mercedes-benz:glb": "glb-klasa",
  "mercedes-benz:glc": "glc-klasa",
  "mercedes-benz:gle": "gle-klasa",
  "mercedes-benz:gls": "gls-klasa",
  "mercedes-benz:g-class": "g-klasa",
  "mercedes-benz:g-klasse": "g-klasa",

  // Audi — Otomoto splits A4/A5/A6 by body, there is no bare "a4" page
  // (audi/a4 returns the full 19,190-offer make list = soft fallback).
  "audi:a4": "a4-limousine",
  "audi:a5": "a5-sportback",
  "audi:a6": "a6-limousine",
  "audi:a3": "a3-sportback",
};

/**
 * Body-aware variants: when the user asked for an estate/wagon, prefer the
 * brand's estate slug. Keyed by `${makeSlug}:${modelSlug}:${bodyStyle}`.
 */
const BODY_VARIANT_SLUGS: Record<string, string> = {
  "volkswagen:golf:estate": "golf-variant",
  "volkswagen:passat:estate": "passat-variant",
  "ford:focus:estate": "focus-sw",
  "audi:a4-limousine:estate": "a4-avant",
  "audi:a6-limousine:estate": "a6-avant",
  "audi:a3-sportback:estate": "a3-sportback",
};

/**
 * Generation slugs, keyed by `${makeSlug}:${modelSlug}:${generationToken}`.
 *
 * DANGER: unlike the numeric filters (which Otomoto silently ignores when
 * unknown), an INVALID filter_enum_generation value returns ZERO results —
 * verified: gen-zzzz-9999 → "0 ogłoszeń". So we only ever emit a generation
 * that appears in this verified map; an unknown generation is dropped and the
 * year range carries the intent instead.
 */
const GENERATION_SLUGS: Record<string, string> = {
  // VW Golf (verified from otomoto.pl generation facet)
  "volkswagen:golf:1": "gen-i-1974-1983",
  "volkswagen:golf:2": "gen-ii-1983-1992",
  "volkswagen:golf:3": "gen-iii-1991-1998",
  "volkswagen:golf:4": "gen-iv-1997-2006",
  "volkswagen:golf:5": "gen-v-2003-2009",
  "volkswagen:golf:6": "gen-vi-2008-2013",
  "volkswagen:golf:7": "gen-vii-2012",
  "volkswagen:golf:8": "gen-viii-2020",
};

/** Roman numerals / "mk8" / "viii" → a plain generation token ("8"). */
const ROMAN_TO_ARABIC: Record<string, string> = {
  i: "1", ii: "2", iii: "3", iv: "4", v: "5",
  vi: "6", vii: "7", viii: "8", ix: "9", x: "10",
};

/** Lowercase, strip accents, collapse separators → a stable lookup token. */
export function normalizeToken(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(RegExp(String.raw`\p{Diacritic}`, "gu"), "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function otomotoMakeSlug(makeSlug: string | null, makeDisplay: string | null): string | null {
  const base = makeSlug ?? (makeDisplay ? normalizeToken(makeDisplay) : null);
  if (!base) return null;
  return MAKE_SLUG_OVERRIDES[base] ?? base;
}

export interface OtomotoModelResolution {
  slug: string | null;
  /** True when the slug came from the curated override map (high confidence). */
  curated: boolean;
}

/**
 * Resolve a model to its Otomoto slug.
 * Curated override → body-aware variant → normalized plain name.
 * A plain-name slug is NOT guaranteed to exist; the caller may verify it with
 * the strict-subset offer-count test before trusting it.
 */
export function otomotoModelSlug(
  makeSlug: string,
  model: string | null,
  bodyStyle?: string | null,
): OtomotoModelResolution {
  if (!model) return { slug: null, curated: false };

  const token = normalizeToken(model);
  if (!token) return { slug: null, curated: false };

  const override = MODEL_SLUG_OVERRIDES[`${makeSlug}:${token}`];
  const slug = override ?? token;
  const curated = Boolean(override);

  if (bodyStyle) {
    const variant = BODY_VARIANT_SLUGS[`${makeSlug}:${slug}:${normalizeToken(bodyStyle)}`];
    if (variant) return { slug: variant, curated: true };
  }

  return { slug, curated };
}

/**
 * Resolve a generation to a verified Otomoto generation slug.
 * Returns null when we have no verified value — callers must then omit the
 * filter entirely rather than guess (a wrong value yields an empty page).
 */
export function otomotoGenerationSlug(
  makeSlug: string,
  modelSlug: string,
  generation: string | null | undefined,
): string | null {
  if (!generation) return null;

  // "Mk8" / "mark 8" / "VIII" / "8th" → "8"
  const raw = normalizeToken(generation).replace(/^(mk|mark|gen|generation)-?/, "").replace(/-?(th|st|nd|rd)$/, "");
  const token = ROMAN_TO_ARABIC[raw] ?? raw;

  return GENERATION_SLUGS[`${makeSlug}:${modelSlug}:${token}`] ?? null;
}

/** Otomoto fuel enum values (verified: fuel_type=petrol narrows 3,393 → 1,892). */
export const OTOMOTO_FUEL: Record<string, string> = {
  petrol: "petrol",
  diesel: "diesel",
  electric: "electric",
  hybrid: "hybrid",
  plug_in_hybrid: "plugin-hybrid",
};

/** Otomoto body enum values (verified: body_type=combi narrows 3,393 → 853). */
export const OTOMOTO_BODY: Record<string, string> = {
  hatchback: "hatchback",
  sedan: "sedan",
  estate: "combi",
  suv: "suv",
  coupe: "coupe",
  cabriolet: "cabriolet",
  mpv: "minivan",
  van: "van",
};

/** Otomoto gearbox enum values (verified: gearbox=automatic narrows 3,393 → 1,063). */
export const OTOMOTO_GEARBOX: Record<string, string> = {
  automatic: "automatic",
  manual: "manual",
};
