// Unified recommendation pipeline for marketplace links.
// This is the single source of truth for the UI card — all fields must align.

import type { CarSearchIntent, CountryCode, MarketSearchStatus } from "./autoscout/types";
import { getCarImage } from "./carImages";

export type Marketplace = "autoscout24" | "otomoto";

export interface Recommendation {
  // Status
  status: MarketSearchStatus; // "success" | "no_match" | "needs_clarification" | "error"
  
  // Identity
  title: string; // "Volkswagen Golf GTI Mark 8"
  country: CountryCode;
  marketplace: Marketplace;
  
  // Structured filters
  make: string | null;
  model: string | null;
  generation: string | null; // "Mark 8", "MK5", etc.
  bodyType: string | null;
  fuelType: string | null;
  gearbox: string | null;
  
  // Ranges
  yearFrom: number | null;
  yearTo: number | null;
  priceFrom: number | null;
  priceTo: number | null;
  mileageFrom: number | null;
  mileageTo: number | null;
  
  // Poland-specific states
  state: "new" | "used" | "any" | null; // Dowolny / Nowy / Używany
  damageState: "intact" | "damaged" | "any" | null; // Nieu uszkodzony / Uszkodzony / Dowolny
  location: string | null; // City or region
  
  // Output
  imageUrl: string;
  /** <img onError> target — always a committed asset, so nothing ever breaks. */
  imageFallback: string;
  imageAlt: string;
  searchUrl: string; // The final external marketplace URL
  
  // Metadata
  degraded: boolean; // true if we couldn't fulfill all filters
  degradeReason: string | null;
  verified: boolean; // true if URL was validated via HEAD request
  explanation: string | null; // Human-friendly note, e.g. "Model not available on Otomoto — showing all BMW results"
  
  // Source intent for debugging
  sourceIntent: CarSearchIntent;
}

/**
 * Image resolution lives in lib/carImages — a curated, watermark-free catalog of
 * locally hosted photos. These thin wrappers keep existing callers working;
 * prefer getCarImage() directly when you also want the alt text and fallback.
 */
export function imageUrlForRecommendation(reco: Recommendation): string {
  return getCarImage({ make: reco.make, model: reco.model, title: reco.title }).src;
}

export function imageUrlForMakeModel(make: string | null, model: string | null): string {
  return getCarImage({ make, model }).src;
}

/**
 * Validates that all fields of a Recommendation are internally consistent.
 * Returns an array of issues (empty if valid).
 */
export function validateRecommendation(reco: Recommendation): string[] {
  const issues: string[] = [];
  
  if (reco.title && reco.make && !reco.title.toLowerCase().includes(reco.make.toLowerCase())) {
    issues.push(`Title "${reco.title}" does not match make "${reco.make}"`);
  }
  
  if (reco.yearFrom && reco.yearTo && reco.yearFrom > reco.yearTo) {
    issues.push(`yearFrom (${reco.yearFrom}) > yearTo (${reco.yearTo})`);
  }
  
  if (reco.priceFrom && reco.priceTo && reco.priceFrom > reco.priceTo) {
    issues.push(`priceFrom (${reco.priceFrom}) > priceTo (${reco.priceTo})`);
  }
  
  if (reco.mileageFrom && reco.mileageTo && reco.mileageFrom > reco.mileageTo) {
    issues.push(`mileageFrom (${reco.mileageFrom}) > mileageTo (${reco.mileageTo})`);
  }
  
  return issues;
}
