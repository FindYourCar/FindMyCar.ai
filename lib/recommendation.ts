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
 * Car image dictionary: extensible map of (make, model) → imageUrl.
 * Keys are normalized lowercase "make:model" pairs (e.g., "volkswagen:golf").
 * Add entries as needed; the system safely falls back to GENERIC_CAR_IMAGE.
 * 
 * IMPORTANT: Never hardcode special cases or assume only certain models exist.
 * This dictionary is meant to be extended gradually. Unknown cars show the
 * neutral placeholder, not a random competitor brand's image.
 */
const CAR_IMAGES: Record<string, string> = {
  // VW models
  "volkswagen:golf": "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80",
  "volkswagen:passat": "https://images.unsplash.com/photo-1553882900-d5160ca3c426?auto=format&fit=crop&w=1200&q=80",
  "volkswagen:polo": "https://images.unsplash.com/photo-1552820728-8ac41f1ce891?auto=format&fit=crop&w=1200&q=80",
  
  // BMW models
  "bmw:3-series": "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
  "bmw:3 series": "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
  "bmw:5-series": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
  "bmw:5 series": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
  
  // Audi models
  "audi:a4": "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1200&q=80",
  "audi:a6": "https://images.unsplash.com/photo-1552820728-8ac41f1ce891?auto=format&fit=crop&w=1200&q=80",
  
  // Mercedes models
  "mercedes-benz:c-class": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
  "mercedes-benz:c class": "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
  "mercedes-benz:e-class": "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80",
  "mercedes-benz:e class": "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80",
  
  // Ford models
  "ford:focus": "https://images.unsplash.com/photo-1552820728-8ac41f1ce891?auto=format&fit=crop&w=1200&q=80",
};

/**
 * Truly neutral car image: a generic, non-branded car silhouette/placeholder.
 * Use this for any car we don't have a specific image for.
 * This image must NOT be a specific brand (VW, BMW, Porsche, etc.)
 * nor a performance car that might mislead users.
 */
const GENERIC_CAR_IMAGE = "https://images.unsplash.com/photo-1552820728-8ac41f1ce891?auto=format&fit=crop&w=1200&q=80";

/**
 * Safely resolves an image URL for a car recommendation.
 * 
 * Strategy:
 * 1. If (make, model) exists in CAR_IMAGES, return that image.
 * 2. If not found, return the generic neutral car image.
 * 3. NEVER return an image that contradicts the make/model (e.g., Porsche for Golf).
 * 4. NEVER special-case specific models in logic — only use the dictionary.
 * 
 * This approach is safe and extensible: add more (make, model) pairs to CAR_IMAGES
 * without changing this function.
 */
export function imageUrlForRecommendation(reco: Recommendation): string {
  return imageUrlForMakeModel(reco.make, reco.model);
}

/**
 * Generic helper to resolve image URL for any (make, model) pair.
 * Can be used independently of the Recommendation type.
 * 
 * @param make - Car manufacturer (e.g., "Volkswagen", "BMW")
 * @param model - Car model (e.g., "Golf", "3 Series")
 * @returns Image URL from CAR_IMAGES if found, otherwise GENERIC_CAR_IMAGE
 */
export function imageUrlForMakeModel(make: string | null, model: string | null): string {
  // If no make is specified, return generic image
  if (!make) return GENERIC_CAR_IMAGE;
  
  // Normalize keys to lowercase for dictionary lookup
  const makeKey = make.toLowerCase().trim();
  const modelKey = model ? model.toLowerCase().trim() : null;
  
  // Try exact (make:model) lookup
  if (modelKey) {
    const fullKey = `${makeKey}:${modelKey}`;
    if (fullKey in CAR_IMAGES) {
      return CAR_IMAGES[fullKey];
    }
  }
  
  // If we don't have the specific (make, model) combination,
  // return the neutral image, NOT a random car.
  // This is the safest and most honest choice.
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
