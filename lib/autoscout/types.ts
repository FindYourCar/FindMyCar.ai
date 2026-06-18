// Shared types for the AutoScout24 live-market search pipeline.
// The LLM only ever produces a RawCarIntent (loose, possibly misspelled).
// normalizeIntent() turns it into a CarSearchIntent (clean, mapped).
// The server builds + validates the URL and returns a MarketSearchResult.

export type CountryCode = "NL" | "BE" | "DE" | "PL";

export type FuelType =
  | "petrol"
  | "diesel"
  | "hybrid"
  | "plug_in_hybrid"
  | "electric";

export type TransmissionType = "automatic" | "manual";

/** Loose shape the LLM (or regex extractor) returns — nothing is trusted yet. */
export interface RawCarIntent {
  make?: string | null;
  model?: string | null;
  variant?: string | null;
  country?: string | null;          // "belgium", "BE", "Netherlands"…
  maxMileage?: number | string | null; // "50,000", "50k", 50000
  minPrice?: number | string | null;
  maxPrice?: number | string | null;
  fuel?: string | null;
  transmission?: string | null;
  yearFrom?: number | string | null;
  yearTo?: number | string | null;
  /** Free text fallback, used to extract mileage/price if structured fields are empty. */
  rawText?: string | null;
}

export type BodyStyle = "hatchback" | "sedan" | "estate" | "suv" | "coupe" | "cabriolet" | "mpv" | "van";

/** A model the resolver considered plausible when the request was ambiguous. */
export interface ModelCandidate {
  display: string;
  slug: string;
}

/** Clean, normalized intent — every field is either a valid value or null. */
export interface CarSearchIntent {
  make: string | null;        // display, e.g. "Mercedes-Benz"
  makeSlug: string | null;    // registry slug, e.g. "mercedes-benz"
  model: string | null;       // display, e.g. "CLE"
  modelSlug: string | null;   // registry slug, e.g. "cle" (null if unknown)
  modelVerified: boolean;     // true when modelSlug came from the taxonomy
  bodyStyle: BodyStyle | null;
  trims: string[];
  country: CountryCode;
  countryLabel: string;
  maxMileage: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  fuel: FuelType | null;
  transmission: TransmissionType | null;
  yearFrom: number | null;
  yearTo: number | null;
  /** 0..1 — how sure the resolver is about make+model. */
  confidence: number;
  /** Plausible models when the request was ambiguous (drives clarification). */
  modelCandidates: ModelCandidate[];
  /** True when the resolver couldn't safely pick one model. */
  needsClarification: boolean;
  /** Human question to ask the user when needsClarification is true. */
  clarification: string | null;
  missingFields: string[];
}

export type MarketSearchStatus = "success" | "no_match" | "needs_clarification" | "error";

export interface MarketSearchResult {
  status: MarketSearchStatus;
  /** Final, safe-to-open URL (never a known-dead page). */
  url: string | null;
  /** True only when the URL returned HTTP 200 from validation. */
  verified: boolean;
  /** True when we dropped the model and linked to make-only results. */
  degraded: boolean;
  degradeReason: string | null;
  title: string;
  intent: CarSearchIntent;
  image: {
    primary: string;
    fallbacks: string[];
    alt: string;
  };
  note: string | null;
}
