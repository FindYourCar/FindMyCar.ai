// ── Otomoto.pl provider (Poland) ───────────────────────────────────────────
// Poland is a first-class market, not an AutoScout fallback: AutoScout24 has
// ~zero PL inventory, so a Polish request is served by otomoto.pl with real
// make + model + generation + numeric filters.
//
// Every param below was verified against live otomoto.pl offer counts
// (baseline: volkswagen/golf = 3,393 offers):
//   search[filter_float_year:from]=2019          → 880    ✅ honoured
//   search[filter_float_first_registration_year] → 3,393  ❌ SILENTLY IGNORED
//   search[filter_float_mileage:to]=80000        → 581    ✅
//   search[filter_float_price:to]=50000          → 2,443  ✅ (PLN, not EUR)
//   search[filter_enum_fuel_type]=petrol         → 1,892  ✅
//   search[filter_enum_gearbox]=automatic        → 1,063  ✅
//   search[filter_enum_body_type]=combi          → 853    ✅
//   search[filter_enum_generation]=gen-viii-2020 → 699    ✅
//
// Two failure modes worth knowing:
//  1. Unknown FLOAT/ENUM filter keys are silently ignored (graceful).
//  2. A *known* key with an INVALID value is NOT graceful — an unknown
//     generation slug returns ZERO results. So generations are emitted only
//     from the verified map in otomotoTaxonomy.ts.

import type {
  MarketplaceProvider,
  MarketplaceSearchInput,
  MarketplaceSearchResult,
} from "./types";
import {
  OTOMOTO_BODY,
  OTOMOTO_FUEL,
  OTOMOTO_GEARBOX,
  otomotoGenerationSlug,
  otomotoMakeSlug,
  otomotoModelSlug,
} from "./otomotoTaxonomy";

const OTOMOTO_BASE = "https://www.otomoto.pl/osobowe";

/**
 * Otomoto prices are PLN-only — the `filter_enum_price_currency=EUR` param has
 * no effect (verified: identical counts with and without it). Passing raw euros
 * would filter ~4.3x too aggressively (€12,000 read as 12,000 PLN ≈ €2,800), so
 * we convert. Rate is a rough, deliberately conservative constant; override with
 * MARKETPLACE_EUR_PLN when a live FX source is wired in.
 */
const DEFAULT_EUR_PLN = 4.3;

function eurToPln(eur: number): number {
  const configured = Number(process.env.MARKETPLACE_EUR_PLN);
  const rate = Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_EUR_PLN;
  // Round to a tidy 500 PLN so the URL reads like a human-chosen bound.
  return Math.round((eur * rate) / 500) * 500;
}

export const otomotoProvider: MarketplaceProvider = {
  marketplace: "otomoto",

  supportsCountry(countryCode: string): boolean {
    return countryCode === "PL";
  },

  buildSearchUrl(input: MarketplaceSearchInput): MarketplaceSearchResult {
    const unsupported: string[] = [];

    const makeSlug = otomotoMakeSlug(input.makeSlug ?? null, input.make ?? null);
    const { slug: modelSlug } = makeSlug
      ? otomotoModelSlug(makeSlug, input.model ?? null, input.bodyType ?? null)
      : { slug: null };

    // Path: /osobowe/{make}/{model} — model included whenever we resolved one.
    const segments = [makeSlug, modelSlug].filter((s): s is string => Boolean(s));
    const path = segments.length ? `/${segments.join("/")}` : "";

    const params = new URLSearchParams();

    // Generation — ONLY from the verified map (a wrong value returns 0 results).
    let generationApplied = false;
    if (makeSlug && modelSlug && input.generation) {
      const genSlug = otomotoGenerationSlug(makeSlug, modelSlug, input.generation);
      if (genSlug) {
        params.set("search[filter_enum_generation]", genSlug);
        generationApplied = true;
      } else {
        // Degrade gracefully: drop the generation, keep the year range, and be
        // honest that the narrowing came from years rather than a generation.
        unsupported.push(`generation "${input.generation}"`);
      }
    }

    // Year range — production year ("Rok produkcji").
    if (input.minYear) params.set("search[filter_float_year:from]", String(input.minYear));
    if (input.maxYear) params.set("search[filter_float_year:to]", String(input.maxYear));

    // Mileage.
    if (input.maxMileageKm) params.set("search[filter_float_mileage:to]", String(input.maxMileageKm));

    // Price — converted EUR → PLN.
    if (input.minPriceEur) params.set("search[filter_float_price:from]", String(eurToPln(input.minPriceEur)));
    if (input.maxPriceEur) params.set("search[filter_float_price:to]", String(eurToPln(input.maxPriceEur)));

    // Enums.
    if (input.fuelType) {
      const fuel = OTOMOTO_FUEL[input.fuelType];
      if (fuel) params.set("search[filter_enum_fuel_type]", fuel);
      else unsupported.push(`fuel "${input.fuelType}"`);
    }
    if (input.transmission) {
      const gearbox = OTOMOTO_GEARBOX[input.transmission];
      if (gearbox) params.set("search[filter_enum_gearbox]", gearbox);
      else unsupported.push(`gearbox "${input.transmission}"`);
    }
    if (input.bodyType) {
      const body = OTOMOTO_BODY[input.bodyType];
      if (body) params.set("search[filter_enum_body_type]", body);
      else unsupported.push(`body "${input.bodyType}"`);
    }

    params.set("utm_source", "findmycar");
    params.set("utm_medium", "live_market");

    const url = `${OTOMOTO_BASE}${path}?${params.toString()}`;

    // "Degraded" means we could not narrow to the requested MODEL. Losing only
    // the generation is not a degrade — the year filter still carries the intent.
    const wantedModel = Boolean(input.model);
    const gotModel = Boolean(modelSlug);
    const degraded = wantedModel && !gotModel;

    return {
      marketplace: "otomoto",
      countryCode: "PL",
      url,
      displayBrand: "Otomoto",
      displayLabel: "Otomoto · PL",
      displayDomain: "otomoto.pl",
      degraded,
      degradeReason: degraded
        ? `We couldn't map "${input.model}" to an Otomoto model page — showing all ${input.make} results.`
        : null,
      hasModelFilter: gotModel,
      unsupportedFilters: generationApplied ? unsupported.filter((u) => !u.startsWith("generation")) : unsupported,
    };
  },
};
