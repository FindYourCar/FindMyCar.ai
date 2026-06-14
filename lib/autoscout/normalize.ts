// Deterministic normalization: RawCarIntent → CarSearchIntent.
// Maps misspellings/aliases, extracts mileage & price from loose strings, and
// resolves model slugs ONLY from the curated registry (never guesses).

import type { CarSearchIntent, CountryCode, FuelType, RawCarIntent, TransmissionType } from "./types";
import {
  COUNTRY_ALIASES, COUNTRY_LABELS, FUEL_ALIASES, MAKE_ALIASES, MAKES, TRANSMISSION_ALIASES,
} from "./registry";

const DEFAULT_COUNTRY: CountryCode = "NL";

const clean = (s: unknown): string =>
  typeof s === "string" ? s.trim().toLowerCase().replace(/\s+/g, " ") : "";

/** "50,000" | "50.000" | "50k" | "50 000 km" | 50000 → 50000 */
export function parseMileage(input: number | string | null | undefined): number | null {
  if (typeof input === "number" && Number.isFinite(input)) return Math.round(input);
  if (typeof input !== "string") return null;
  const m = input.toLowerCase().match(/(\d[\d.,\s]*)\s*(k)?/);
  if (!m) return null;
  let n = parseFloat(m[1].replace(/[.,\s]/g, ""));
  if (!Number.isFinite(n)) return null;
  if (m[2] === "k" && n < 1000) n *= 1000; // "50k" → 50000
  return n > 0 ? Math.round(n) : null;
}

/** "€24,000" | "24k" | "24000" → 24000 */
export function parsePrice(input: number | string | null | undefined): number | null {
  if (typeof input === "number" && Number.isFinite(input)) return Math.round(input);
  if (typeof input !== "string") return null;
  const m = input.toLowerCase().replace(/[€$£]/g, "").match(/(\d[\d.,\s]*)\s*(k)?/);
  if (!m) return null;
  let n = parseFloat(m[1].replace(/[.,\s]/g, ""));
  if (!Number.isFinite(n)) return null;
  if (m[2] === "k" && n < 1000) n *= 1000;
  return n > 0 ? Math.round(n) : null;
}

function parseYear(input: number | string | null | undefined): number | null {
  if (typeof input === "number" && input >= 1950 && input <= 2100) return Math.round(input);
  if (typeof input !== "string") return null;
  const m = input.match(/\b(19[5-9]\d|20[0-4]\d)\b/);
  return m ? parseInt(m[1], 10) : null;
}

function resolveCountry(raw: string | null | undefined): CountryCode {
  const key = clean(raw);
  return COUNTRY_ALIASES[key] ?? (key.toUpperCase() in COUNTRY_LABELS ? (key.toUpperCase() as CountryCode) : DEFAULT_COUNTRY);
}

function resolveEnum<T extends string>(raw: string | null | undefined, aliases: Record<string, T>): T | null {
  const key = clean(raw);
  return key ? aliases[key] ?? null : null;
}

/** Scan free text for the first (longest) matching alias as a whole word. */
function scanAliases<T extends string>(text: string, aliases: Record<string, T>): T | null {
  const t = clean(text);
  if (!t) return null;
  for (const alias of Object.keys(aliases).sort((a, b) => b.length - a.length)) {
    const re = new RegExp(`\\b${alias.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i");
    if (re.test(t)) return aliases[alias];
  }
  return null;
}

/** Returns {makeKey, display, slug} from a loose make string, or nulls. */
function resolveMake(raw: string | null | undefined) {
  const key = clean(raw);
  if (!key) return { makeKey: null, display: null, slug: null };
  const canonical = MAKE_ALIASES[key] ?? (MAKES[key] ? key : null);
  if (!canonical || !MAKES[canonical]) return { makeKey: null, display: null, slug: null };
  return { makeKey: canonical, display: MAKES[canonical].display, slug: MAKES[canonical].slug };
}

/** Resolves a model slug ONLY from the registry for the given make. Tries a few
 *  deterministic key variants (all still registry-bound — never invents slugs):
 *  exact → dotless → engine-badge stripped ("330i" → "330"). */
function resolveModel(makeKey: string | null, raw: string | null | undefined) {
  const display = typeof raw === "string" && raw.trim() ? raw.trim() : null;
  if (!makeKey || !display) return { display, slug: null, verified: false };
  const models = MAKES[makeKey]?.models ?? {};
  const base = clean(display);
  const variants = [
    base,
    base.replace(/\./g, ""),
    base.replace(/(\d{2,3})\s*[a-z]$/i, "$1"), // 330i/320d/520e → 330/320/520
    base.split(" ")[0],                         // "a6 avant" → "a6"
  ];
  for (const v of variants) {
    if (v && models[v]) return { display, slug: models[v], verified: true };
  }
  return { display, slug: null, verified: false };
}

/** Registry-bound recovery of make/model from free text (used when the upstream
 *  extractor didn't pass them). Deterministic — only returns known aliases. */
function extractMakeModelFromText(text: string) {
  const t = clean(text);
  if (!t) return { makeKey: null as string | null, model: null as string | null };
  let makeKey: string | null = null;
  for (const alias of Object.keys(MAKE_ALIASES).sort((a, b) => b.length - a.length)) {
    const re = new RegExp(`\\b${alias.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i");
    if (re.test(t)) { makeKey = MAKE_ALIASES[alias]; break; }
  }
  if (!makeKey) return { makeKey: null, model: null };
  let model: string | null = null;
  const aliases = Object.keys(MAKES[makeKey].models).filter((a) => a.length >= 2).sort((a, b) => b.length - a.length);
  for (const alias of aliases) {
    const re = new RegExp(`\\b${alias.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i");
    if (re.test(t)) { model = alias; break; }
  }
  return { makeKey, model };
}

export function normalizeIntent(raw: RawCarIntent): CarSearchIntent {
  const text = typeof raw.rawText === "string" ? raw.rawText : "";

  let make = resolveMake(raw.make);
  let model = resolveModel(make.makeKey, raw.model);

  // Fallback: recover make/model from the original message when missing.
  if ((!make.slug || !model.slug) && text) {
    const fromText = extractMakeModelFromText(text);
    if (!make.slug && fromText.makeKey) make = resolveMake(fromText.makeKey);
    if (!model.slug) model = resolveModel(make.makeKey, raw.model || fromText.model);
  }

  // Country/fuel/transmission: prefer structured, fall back to scanning the text.
  let country = resolveCountry(raw.country);
  if (!raw.country && text) {
    const c = scanAliases(text, COUNTRY_ALIASES);
    if (c) country = c;
  }

  const maxMileage = parseMileage(raw.maxMileage) ?? parseMileage(matchMileage(text));
  const maxPrice = parsePrice(raw.maxPrice) ?? parsePrice(matchPrice(text));
  const minPrice = parsePrice(raw.minPrice);
  const fuel = resolveEnum<FuelType>(raw.fuel, FUEL_ALIASES) ?? (text ? scanAliases(text, FUEL_ALIASES) : null);
  const transmission = resolveEnum<TransmissionType>(raw.transmission, TRANSMISSION_ALIASES) ?? (text ? scanAliases(text, TRANSMISSION_ALIASES) : null);
  const yearFrom = parseYear(raw.yearFrom);
  const yearTo = parseYear(raw.yearTo);

  const missingFields: string[] = [];
  if (!make.slug) missingFields.push("make");
  if (!model.slug) missingFields.push("model");

  return {
    make: make.display,
    makeSlug: make.slug,
    model: model.display,
    modelSlug: model.slug,
    modelVerified: model.verified,
    country,
    countryLabel: COUNTRY_LABELS[country],
    maxMileage,
    minPrice,
    maxPrice,
    fuel,
    transmission,
    yearFrom,
    yearTo,
    missingFields,
  };
}

// Free-text fallbacks (only used when structured fields are empty)
function matchMileage(text: string): string | null {
  const m = text.match(/(\d[\d.,\s]*)\s*(?:k\s*)?(?:km|kms|kilometres|kilometers|miles|mi)\b/i);
  return m ? m[0] : null;
}
function matchPrice(text: string): string | null {
  // Require a price cue. The "k" thousands-suffix only counts when NOT followed
  // by a letter (so "kilometers" isn't read as "k"), and if a distance unit
  // follows, the number is mileage — not a budget — so we bail.
  const m = text.match(
    /(?:€|under|below|max|up to|budget|less than)\s*€?\s*(\d[\d.,]*)(\s*k(?![a-z]))?\s*(km|kms|kilometres|kilometers|miles|mi)?/i,
  );
  if (!m) return null;
  if (m[3]) return null; // trailing distance unit → mileage, not price
  return m[1] + (m[2] ? "k" : "");
}
