// Deterministic normalization: RawCarIntent → CarSearchIntent.
// Make/model resolution is delegated to the taxonomy resolver (resolve.ts); this
// module owns the numeric/enum filters (country, fuel, transmission, mileage,
// price, year) and free-text extraction of those when structured fields are empty.

import type { CarSearchIntent, CountryCode, FuelType, RawCarIntent, TransmissionType } from "./types";
import { COUNTRY_ALIASES, COUNTRY_LABELS, FUEL_ALIASES, TRANSMISSION_ALIASES } from "./registry";
import { resolveVehicle } from "./resolve";

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
  if (m[2] === "k" && n < 1000) n *= 1000;
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

function scanAliases<T extends string>(text: string, aliases: Record<string, T>): T | null {
  const t = clean(text);
  if (!t) return null;
  for (const alias of Object.keys(aliases).sort((a, b) => b.length - a.length)) {
    const re = new RegExp(`\\b${alias.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i");
    if (re.test(t)) return aliases[alias];
  }
  return null;
}

export function normalizeIntent(raw: RawCarIntent): CarSearchIntent {
  const text = typeof raw.rawText === "string" ? raw.rawText : "";

  // ── Make + model via the taxonomy resolver (single source of truth) ──
  const v = resolveVehicle(raw.make, raw.model, text);

  // ── Country / fuel / transmission: structured first, then text scan ──
  let country = resolveCountry(raw.country);
  if (!raw.country && text) {
    const c = scanAliases(text, COUNTRY_ALIASES);
    if (c) country = c;
  }
  const fuel = resolveEnum<FuelType>(raw.fuel, FUEL_ALIASES) ?? (text ? scanAliases(text, FUEL_ALIASES) : null);
  const transmission = resolveEnum<TransmissionType>(raw.transmission, TRANSMISSION_ALIASES) ?? (text ? scanAliases(text, TRANSMISSION_ALIASES) : null);

  const maxMileage = parseMileage(raw.maxMileage) ?? parseMileage(matchMileage(text));
  const maxPrice = parsePrice(raw.maxPrice) ?? parsePrice(matchPrice(text));
  const minPrice = parsePrice(raw.minPrice);
  const yearFrom = parseYear(raw.yearFrom);
  const yearTo = parseYear(raw.yearTo);

  const missingFields: string[] = [];
  if (!v.makeSlug) missingFields.push("make");
  if (!v.modelSlug) missingFields.push("model");

  // Narrowing hints: terms we understood but do NOT translate into a hard
  // provider filter (so we never over-promise a trim-level guarantee). Drawn
  // from the resolved trims, body style, and a drivetrain scan of the text.
  const DRIVETRAIN_HINTS: Record<string, string> = {
    xdrive: "xDrive", quattro: "quattro", "4matic": "4MATIC", "4motion": "4MOTION",
    awd: "AWD", "4wd": "4WD", "4x4": "4x4", "all-wheel drive": "AWD", allrad: "Allrad",
  };
  const narrowingHints: string[] = [];
  for (const tr of v.trims) narrowingHints.push(tr.toUpperCase());
  for (const [alias, label] of Object.entries(DRIVETRAIN_HINTS)) {
    if (text && new RegExp(`(^|[^a-z0-9])${alias.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}([^a-z0-9]|$)`, "i").test(text)) {
      if (!narrowingHints.includes(label)) narrowingHints.push(label);
    }
  }
  if (v.bodyStyle) narrowingHints.push(v.bodyStyle.charAt(0).toUpperCase() + v.bodyStyle.slice(1));

  return {
    make: v.make,
    makeSlug: v.makeSlug,
    model: v.model,
    modelSlug: v.modelSlug,
    modelVerified: v.modelVerified,
    bodyStyle: v.bodyStyle,
    trims: v.trims,
    country,
    countryLabel: COUNTRY_LABELS[country],
    maxMileage,
    minPrice,
    maxPrice,
    fuel,
    transmission,
    yearFrom,
    yearTo,
    confidence: v.confidence,
    modelCandidates: v.candidates,
    needsClarification: v.needsClarification,
    clarification: v.clarification,
    missingFields,
    narrowingHints: Array.from(new Set(narrowingHints)),
  };
}

// Free-text fallbacks (only used when structured fields are empty)
function matchMileage(text: string): string | null {
  const m = text.match(/(\d[\d.,\s]*)\s*(?:k\s*)?(?:km|kms|kilometres|kilometers|miles|mi)\b/i);
  return m ? m[0] : null;
}
function matchPrice(text: string): string | null {
  const m = text.match(
    /(?:€|under|below|max|up to|budget|less than)\s*€?\s*(\d[\d.,]*)(\s*k(?![a-z]))?\s*(km|kms|kilometres|kilometers|miles|mi)?/i,
  );
  if (!m) return null;
  if (m[3]) return null;
  return m[1] + (m[2] ? "k" : "");
}
