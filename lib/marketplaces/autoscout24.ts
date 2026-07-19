// ── AutoScout24 provider (NL / BE / DE) ────────────────────────────────────
// Thin provider wrapper around the existing, battle-tested URL builder in
// lib/autoscout/buildUrl.ts. The builder stays the single source of truth for
// AutoScout param names and country codes; this file only adapts it to the
// shared MarketplaceProvider contract so the route can treat every market the
// same way.

import type {
  MarketplaceProvider,
  MarketplaceSearchInput,
  MarketplaceSearchResult,
} from "./types";
import type { BodyStyle, CarSearchIntent, CountryCode, FuelType, TransmissionType } from "../autoscout/types";
import { buildAutoscoutUrl } from "../autoscout/buildUrl";
import { COUNTRY_LABELS } from "../autoscout/registry";

const SUPPORTED: ReadonlyArray<string> = ["NL", "BE", "DE"];

/**
 * Adapt the shared marketplace input onto the CarSearchIntent shape that
 * buildAutoscoutUrl already understands. Only the fields the builder reads are
 * meaningful; the rest carry safe defaults.
 */
function toIntent(input: MarketplaceSearchInput): CarSearchIntent {
  return {
    make: input.make || null,
    makeSlug: input.makeSlug ?? null,
    model: input.model ?? null,
    modelSlug: input.modelSlug ?? null,
    modelVerified: input.modelVerified ?? false,
    bodyStyle: (input.bodyType as BodyStyle | undefined) ?? null,
    trims: [],
    country: input.countryCode as CountryCode,
    countryLabel: COUNTRY_LABELS[input.countryCode as CountryCode] ?? input.countryCode,
    maxMileage: input.maxMileageKm ?? null,
    minPrice: input.minPriceEur ?? null,
    maxPrice: input.maxPriceEur ?? null,
    fuel: (input.fuelType as FuelType | undefined) ?? null,
    transmission: (input.transmission as TransmissionType | undefined) ?? null,
    yearFrom: input.minYear ?? null,
    yearTo: input.maxYear ?? null,
    confidence: 1,
    modelCandidates: [],
    needsClarification: false,
    clarification: null,
    missingFields: [],
    narrowingHints: [],
  };
}

export const autoScout24Provider: MarketplaceProvider = {
  marketplace: "autoscout24",

  supportsCountry(countryCode: string): boolean {
    return SUPPORTED.includes(countryCode);
  },

  buildSearchUrl(input: MarketplaceSearchInput): MarketplaceSearchResult {
    const built = buildAutoscoutUrl(toIntent(input));

    return {
      marketplace: "autoscout24",
      countryCode: input.countryCode,
      url: built.url,
      displayBrand: "AutoScout24",
      displayLabel: `AutoScout24 · ${input.countryCode}`,
      displayDomain: "autoscout24.de",
      degraded: built.degraded,
      degradeReason: built.degradeReason,
      hasModelFilter: built.hasModelPath,
      // AutoScout expresses every filter we model today.
      unsupportedFilters: [],
    };
  },
};

/** Re-exported so callers can rebuild a make-only URL after a dead model page. */
export function buildAutoScout24MakeOnly(input: MarketplaceSearchInput): MarketplaceSearchResult {
  const built = buildAutoscoutUrl(toIntent(input), { forceMakeOnly: true });
  return {
    marketplace: "autoscout24",
    countryCode: input.countryCode,
    url: built.url,
    displayBrand: "AutoScout24",
    displayLabel: `AutoScout24 · ${input.countryCode}`,
    displayDomain: "autoscout24.de",
    degraded: true,
    degradeReason: built.degradeReason,
    hasModelFilter: false,
    unsupportedFilters: [],
  };
}
