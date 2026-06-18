// Deterministic AutoScout24 URL builder. Builds ONLY from normalized fields via
// URLSearchParams — no handwritten query strings, no guessed slugs. Model is
// added to the path only when it is registry-verified; otherwise the URL stays
// at make-level (which always resolves), so we never emit a path that 404s.

import type { CarSearchIntent } from "./types";
import {
  AUTOSCOUT_BASE, COUNTRY_CY, FUEL_CODES, GEAR_CODES, PARAM_NAMES,
} from "./registry";
import { BODY_CODES } from "./taxonomy";

export interface BuiltUrl {
  url: string;
  /** true when the model was dropped from the path (make-only link) */
  degraded: boolean;
  degradeReason: string | null;
  hasModelPath: boolean;
}

interface BuildOpts {
  /** Force make-only (used as the fallback after a 404). */
  forceMakeOnly?: boolean;
}

export function buildAutoscoutUrl(intent: CarSearchIntent, opts: BuildOpts = {}): BuiltUrl {
  const params = new URLSearchParams({
    atype: "C",
    sort: "standard",
    desc: "0",
    ustate: "N,U",
    utm_source: "findmycar",
    utm_medium: "live_market",
    utm_campaign: "advisor",
  });

  // Country (AutoScout `cy` code; null for unsupported markets like PL)
  const cy = COUNTRY_CY[intent.country];
  if (cy) params.set(PARAM_NAMES.country, cy);

  // Numeric filters — safe regardless of make/model resolution
  if (intent.maxMileage) params.set(PARAM_NAMES.maxMileage, String(intent.maxMileage));
  if (intent.minPrice) params.set(PARAM_NAMES.minPrice, String(intent.minPrice));
  if (intent.maxPrice) params.set(PARAM_NAMES.maxPrice, String(intent.maxPrice));
  if (intent.yearFrom) params.set(PARAM_NAMES.yearFrom, String(intent.yearFrom));
  if (intent.yearTo) params.set(PARAM_NAMES.yearTo, String(intent.yearTo));
  if (intent.fuel && FUEL_CODES[intent.fuel]) params.set(PARAM_NAMES.fuel, FUEL_CODES[intent.fuel]);
  if (intent.transmission && GEAR_CODES[intent.transmission]) {
    params.set(PARAM_NAMES.transmission, GEAR_CODES[intent.transmission]);
  }
  // Body style refines the SAME model (e.g. Golf vs Golf Variant) — safe at any level.
  if (intent.bodyStyle && BODY_CODES[intent.bodyStyle]) {
    params.set("body", BODY_CODES[intent.bodyStyle]);
  }

  // Path: make → make/model (only when model slug is registry-verified)
  let path = "";
  let degraded = false;
  let degradeReason: string | null = null;
  let hasModelPath = false;

  if (intent.makeSlug) {
    path = `/${intent.makeSlug}`;
    if (!opts.forceMakeOnly && intent.modelSlug && intent.modelVerified) {
      path += `/${intent.modelSlug}`;
      hasModelPath = true;
    } else if (intent.model && !intent.modelVerified) {
      degraded = true;
      degradeReason = `“${intent.model}” isn’t in our verified model list — showing all ${intent.make} results.`;
    } else if (opts.forceMakeOnly && intent.model) {
      degraded = true;
      degradeReason = `Exact ${intent.make} ${intent.model} page was unavailable — showing all ${intent.make} results.`;
    }
  }

  const url = `${AUTOSCOUT_BASE}${path}?${params.toString()}`;
  return { url, degraded, degradeReason, hasModelPath };
}
