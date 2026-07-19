// ── Marketplace abstraction ────────────────────────────────────────────────
// One shared contract for every external car marketplace we link out to.
// A provider's only job: turn a normalized search intent into a real, safe URL
// plus the labels the UI needs to describe it honestly.
//
// Design rule: a provider NEVER claims a filter it didn't actually apply.
// Anything it couldn't express goes into `unsupportedFilters`, and the UI is
// free to surface that instead of quietly pretending the search was narrower.

export type Marketplace = "autoscout24" | "otomoto";

export type MarketplaceCountry = "NL" | "BE" | "DE" | "PL";

export interface MarketplaceSearchInput {
  countryCode: MarketplaceCountry;
  /** Display make, e.g. "Volkswagen". */
  make: string;
  /** Display model, e.g. "Golf". Optional: make-only searches are legitimate. */
  model?: string;
  /** Generation as the user expressed it, e.g. "8", "VIII", "Mk8". */
  generation?: string;

  /** Pre-resolved provider-agnostic slugs from lib/autoscout/resolve (when known). */
  makeSlug?: string;
  modelSlug?: string;
  /** True when modelSlug came from the verified taxonomy rather than a guess. */
  modelVerified?: boolean;

  minYear?: number;
  maxYear?: number;
  maxMileageKm?: number;
  minPriceEur?: number;
  maxPriceEur?: number;
  fuelType?: string;
  bodyType?: string;
  transmission?: string;
}

export interface MarketplaceSearchResult {
  marketplace: Marketplace;
  countryCode: string;
  url: string;
  /** Brand name shown to the user, e.g. "AutoScout24" / "Otomoto". */
  displayBrand: string;
  /** Short text for the pill, e.g. "Otomoto · PL". */
  displayLabel: string;
  /** Host shown on the CTA, e.g. "otomoto.pl". */
  displayDomain: string;

  /** True when we could not honour make+model and fell back to something broader. */
  degraded: boolean;
  degradeReason: string | null;
  /** True when the URL narrows to a specific model (not just the brand). */
  hasModelFilter: boolean;
  /** Filters the caller asked for that this provider cannot express. */
  unsupportedFilters: string[];
}

export interface MarketplaceProvider {
  readonly marketplace: Marketplace;
  supportsCountry(countryCode: string): boolean;
  buildSearchUrl(input: MarketplaceSearchInput): MarketplaceSearchResult;
}
