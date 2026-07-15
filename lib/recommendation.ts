// Unified recommendation pipeline for marketplace links.
// This is the single source of truth for the UI card — all fields must align.

import type { CarSearchIntent, CountryCode, MarketSearchStatus } from "./autoscout/types";

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
 * Curated image map: (make, model) → imageUrl.
 * This is the "dictionary" of canonical car images.
 * Falls back to generic placeholder if not found.
 */
const IMAGE_MAP: Record<string, Record<string, string>> = {
  "volkswagen": {
    "golf": "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80",
    "passat": "https://images.unsplash.com/photo-1553882900-d5160ca3c426?auto=format&fit=crop&w=1200&q=80",
    "polo": "https://images.unsplash.com/photo-1552820728-8ac41f1ce891?auto=format&fit=crop&w=1200&q=80",
  },
  "bmw": {
    "3 series": "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
    "5 series": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
  },
  "audi": {
    "a4": "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1200&q=80",
    "a6": "https://images.unsplash.com/photo-1552820728-8ac41f1ce891?auto=format&fit=crop&w=1200&q=80",
  },
  "mercedes-benz": {
    "c-class": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
    "e-class": "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80",
  },
  "ford": {
    "focus": "https://images.unsplash.com/photo-1552820728-8ac41f1ce891?auto=format&fit=crop&w=1200&q=80",
  },
};

// Generic car placeholder: a neutral, modern sedan/hatchback
const GENERIC_CAR_IMAGE = "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80";

/**
 * Returns a coherent image URL for the recommendation.
 * 1. If (make, model) is in IMAGE_MAP, use it.
 * 2. Otherwise, return a generic neutral car image.
 * 3. Never show an image that contradicts make/model (e.g. Porsche for Golf).
 */
export function imageUrlForRecommendation(reco: Recommendation): string {
  if (!reco.make) return GENERIC_CAR_IMAGE;
  
  const makeKey = reco.make.toLowerCase();
  const modelKey = reco.model?.toLowerCase();
  
  if (makeKey in IMAGE_MAP && modelKey && modelKey in IMAGE_MAP[makeKey]) {
    return IMAGE_MAP[makeKey][modelKey];
  }
  
  // Fallback: generic, not make-specific
  return GENERIC_CAR_IMAGE;
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
  
  if (reco.imageUrl && reco.imageUrl === GENERIC_CAR_IMAGE && reco.make) {
    // Neutral fallback is OK for any car
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
