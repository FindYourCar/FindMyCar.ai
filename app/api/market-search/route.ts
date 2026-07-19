// POST /api/market-search
// The ONLY place AutoScout24 and Otomoto URLs are built + validated. Frontend sends a loose
// RawCarIntent; we normalize → build → validate → attach a model image, and return a
// structured Recommendation object that the UI card can render with full consistency.

import { NextResponse } from "next/server";
import type { MarketSearchResult, RawCarIntent } from "@/lib/autoscout/types";
import type { Recommendation } from "@/lib/recommendation";
import { normalizeIntent } from "@/lib/autoscout/normalize";
import { validateAutoscoutUrl } from "@/lib/autoscout/validate";
import { resolveModelSlugLive, resolveMakeSlugLive, resolvePerformanceSlug } from "@/lib/autoscout/liveResolve";
import { detectPerformanceTrim } from "@/lib/autoscout/perfTrim";
import {
  buildAutoScout24MakeOnly,
  detectGeneration,
  marketplaceForCountry,
  MODEL_IMAGE_PLACEHOLDER,
  resolveMarketplaceProvider,
  resolveModelImage,
} from "@/lib/marketplaces";
import type { MarketplaceSearchInput } from "@/lib/marketplaces";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let raw: RawCarIntent;
  try {
    raw = (await req.json()) as RawCarIntent;
  } catch {
    return NextResponse.json(errorResult("Invalid request body."), { status: 400 });
  }

  const intent = normalizeIntent(raw);

  // ── Tier 2: live resolution for the long tail ────────────────────────────
  // (a) Make named but not recognized by either map → probe its make slug live.
  if (!intent.makeSlug && typeof raw.make === "string" && raw.make.trim()) {
    const liveMake = await resolveMakeSlugLive(raw.make);
    if (liveMake) {
      intent.makeSlug = liveMake;
      intent.make = intent.make ?? raw.make.trim();
      if (intent.missingFields.includes("make")) intent.missingFields = intent.missingFields.filter((f) => f !== "make");
    }
  }
  // (b) Model family named but not in the curated taxonomy → generate slug
  //     candidates, validate against AutoScout, use the first that resolves.
  if (intent.makeSlug && !intent.modelSlug && intent.model && !intent.needsClarification) {
    const live = await resolveModelSlugLive(intent.makeSlug, intent.model);
    if (live) {
      intent.modelSlug = live.slug;
      intent.modelVerified = true;
      intent.missingFields = intent.missingFields.filter((f) => f !== "model");
    }
  }

  // ── Tier-A: performance / halo trim (M, AMG, R, GTI, RS, vRS, OPC, GR…) ──
  // If a distinct performance family slug exists on the provider (validated by
  // strict-subset offer count), prefer it over the base family and relabel.
  // Otherwise keep the base family and add an HONEST hint — never pretend the
  // results were filtered to the trim when they weren't.
  let perfHint: string | null = null;
  if (intent.makeSlug && !intent.needsClarification) {
    const perf = detectPerformanceTrim(intent.makeSlug, intent.modelSlug, intent.model, raw.rawText ?? intent.model);
    if (perf) {
      const got = await resolvePerformanceSlug(intent.makeSlug, perf.candidates);
      if (got) {
        intent.modelSlug = got.slug;
        intent.modelVerified = true;
        intent.model = perf.label;
        intent.missingFields = intent.missingFields.filter((f) => f !== "model");
      } else {
        if (!intent.narrowingHints.includes(perf.label)) intent.narrowingHints.unshift(perf.label);
        perfHint = `${perf.label} requested as a performance trim — the marketplace has no separate ${perf.label} listing page, so results include the broader ${intent.model ?? "base"} family.`;
      }
    }
  }

  const title = [intent.make, intent.model].filter(Boolean).join(" ").trim();

  // Ambiguous model (e.g. two plausible families) → ask instead of guessing wrong.
  if (intent.needsClarification && intent.modelCandidates.length > 0) {
    return NextResponse.json(
      baseRecommendation(intent, {
        status: "needs_clarification",
        title: title || `${intent.make ?? "Car"} — which model?`,
        explanation: intent.clarification ?? "Which model did you mean?",
      })
    );
  }

  // Need at least a make (or a numeric filter) to produce a useful link.
  const hasAnyFilter =
    intent.makeSlug || intent.maxMileage || intent.maxPrice || intent.minPrice ||
    intent.yearFrom || intent.fuel || intent.transmission;
  if (!hasAnyFilter) {
    return NextResponse.json(
      noMatchRecommendation(intent, "We couldn't pull structured filters from that request — try naming a brand, budget, or mileage."),
    );
  }

  // Generation ("Golf 8" → "8") drives both the Otomoto generation filter and
  // the model-image lookup. Detected conservatively — see lib/marketplaces.
  const generation = detectGeneration(intent.model, raw.rawText ?? intent.model);

  const searchInput: MarketplaceSearchInput = {
    countryCode: intent.country,
    make: intent.make ?? "",
    model: intent.model ?? undefined,
    generation: generation ?? undefined,
    makeSlug: intent.makeSlug ?? undefined,
    modelSlug: intent.modelSlug ?? undefined,
    modelVerified: intent.modelVerified,
    minYear: intent.yearFrom ?? undefined,
    maxYear: intent.yearTo ?? undefined,
    maxMileageKm: intent.maxMileage ?? undefined,
    minPriceEur: intent.minPrice ?? undefined,
    maxPriceEur: intent.maxPrice ?? undefined,
    fuelType: intent.fuel ?? undefined,
    bodyType: intent.bodyStyle ?? undefined,
    transmission: intent.transmission ?? undefined,
  };

  const image = resolveModelImage(intent.make, intent.model, generation);

  // ── Poland → Otomoto (a first-class market, not a fallback) ──────────────
  // AutoScout has ~zero PL inventory, so Poland is served by its real local
  // marketplace with genuine make + model + generation + numeric filters.
  if (intent.country === "PL") {
    const built = resolveMarketplaceProvider({ countryCode: "PL" }).buildSearchUrl(searchInput);
    const otoState = await validateAutoscoutUrl(built.url);

    // Honest note when a filter the user asked for couldn't be expressed.
    const unsupportedNote = built.unsupportedFilters.length
      ? `Couldn't apply ${built.unsupportedFilters.join(", ")} on Otomoto — narrowed by year range instead.`
      : null;

    const reco: Recommendation = {
      status: "success",
      title: title || "Live market search · Poland",
      country: "PL",
      marketplace: "otomoto",
      make: intent.make,
      model: intent.model,
      generation,
      bodyType: intent.bodyStyle || null,
      fuelType: intent.fuel || null,
      gearbox: intent.transmission || null,
      yearFrom: intent.yearFrom,
      yearTo: intent.yearTo,
      priceFrom: intent.minPrice,
      priceTo: intent.maxPrice,
      mileageFrom: null,
      mileageTo: intent.maxMileage,
      state: "any",
      damageState: "any",
      location: null,
      imageUrl: image.url,
      imageFallbacks: image.fallbacks,
      imageAlt: image.alt,
      searchUrl: built.url,
      degraded: built.degraded,
      degradeReason: built.degradeReason,
      verified: otoState === "ok",
      explanation: perfHint ?? unsupportedNote,
      sourceIntent: intent,
    };

    return NextResponse.json(reco);
  }

  // ── NL / BE / DE → AutoScout24 ───────────────────────────────────────────
  // 1) Best-precision URL (make + verified model when available).
  const provider = resolveMarketplaceProvider({ countryCode: intent.country });
  const primary = provider.buildSearchUrl(searchInput);
  let finalUrl = primary.url;
  let degraded = primary.degraded;
  let degradeReason = primary.degradeReason;
  let verified = false;

  const state = await validateAutoscoutUrl(primary.url);
  if (state === "ok") {
    verified = true;
  } else if (state === "dead" && primary.hasModelFilter) {
    // 2) Model page is dead → fall back to make-only (reliably resolves).
    const makeOnly = buildAutoScout24MakeOnly(searchInput);
    const makeState = await validateAutoscoutUrl(makeOnly.url);
    finalUrl = makeOnly.url;
    degraded = true;
    degradeReason = makeOnly.degradeReason ??
      `Exact ${title || "model"} page was unavailable — showing all ${intent.make ?? "matching"} results.`;
    verified = makeState === "ok";
  } else if (state === "dead") {
    // Make-level path itself dead (rare) → general country search.
    const general = provider.buildSearchUrl({
      ...searchInput,
      make: "",
      model: undefined,
      makeSlug: undefined,
      modelSlug: undefined,
      modelVerified: false,
    });
    finalUrl = general.url;
    degraded = true;
    degradeReason = "Exact results were unavailable — showing the broader market search.";
    verified = (await validateAutoscoutUrl(general.url)) === "ok";
  }
  // state === "inconclusive": keep the registry-built URL, verified stays false.

  const reco: Recommendation = {
    status: "success",
    title: title || "Live market search",
    country: intent.country,
    marketplace: "autoscout24",
    make: intent.make,
    model: intent.model,
    generation,
    bodyType: intent.bodyStyle || null,
    fuelType: intent.fuel || null,
    gearbox: intent.transmission || null,
    yearFrom: intent.yearFrom,
    yearTo: intent.yearTo,
    priceFrom: intent.minPrice,
    priceTo: intent.maxPrice,
    mileageFrom: null,
    mileageTo: intent.maxMileage,
    state: "any",
    damageState: "any",
    location: null,
    imageUrl: image.url,
    imageFallbacks: image.fallbacks,
    imageAlt: image.alt,
    searchUrl: finalUrl,
    degraded,
    degradeReason,
    verified,
    explanation:
      perfHint ??
      (!verified && degraded === false ? "Link built from verified data (live check skipped)." : null),
    sourceIntent: intent,
  };

  return NextResponse.json(reco);
}

function baseRecommendation(
  intent: MarketSearchResult["intent"],
  overrides?: Partial<Recommendation> & { status?: Recommendation["status"] }
): Recommendation {
  const title = [intent.make, intent.model].filter(Boolean).join(" ").trim();
  const image = resolveModelImage(intent.make, intent.model);
  return {
    status: "error",
    title,
    country: intent.country,
    marketplace: marketplaceForCountry(intent.country),
    make: intent.make,
    model: intent.model,
    generation: null,
    bodyType: intent.bodyStyle || null,
    fuelType: intent.fuel || null,
    gearbox: intent.transmission || null,
    yearFrom: intent.yearFrom,
    yearTo: intent.yearTo,
    priceFrom: intent.minPrice,
    priceTo: intent.maxPrice,
    mileageFrom: null,
    mileageTo: intent.maxMileage,
    state: "any",
    damageState: "any",
    location: null,
    imageUrl: image.url,
    imageFallbacks: image.fallbacks,
    imageAlt: image.alt,
    searchUrl: "",
    degraded: false,
    degradeReason: null,
    verified: false,
    explanation: null,
    sourceIntent: intent,
    ...overrides,
  };
}

function noMatchRecommendation(intent: MarketSearchResult["intent"], note: string): Recommendation {
  return baseRecommendation(intent, {
    status: "no_match",
    explanation: note,
  });
}

function errorResult(note: string): Recommendation {
  return {
    status: "error",
    title: "Search error",
    country: "NL",
    marketplace: "autoscout24",
    make: null,
    model: null,
    generation: null,
    bodyType: null,
    fuelType: null,
    gearbox: null,
    yearFrom: null,
    yearTo: null,
    priceFrom: null,
    priceTo: null,
    mileageFrom: null,
    mileageTo: null,
    state: null,
    damageState: null,
    location: null,
    imageUrl: MODEL_IMAGE_PLACEHOLDER,
    imageFallbacks: [],
    imageAlt: "Car marketplace search",
    searchUrl: "",
    degraded: false,
    degradeReason: null,
    verified: false,
    explanation: note,
    sourceIntent: {
      make: null,
      makeSlug: null,
      model: null,
      modelSlug: null,
      modelVerified: false,
      bodyStyle: null,
      trims: [],
      country: "NL",
      countryLabel: "Netherlands",
      maxMileage: null,
      minPrice: null,
      maxPrice: null,
      fuel: null,
      transmission: null,
      yearFrom: null,
      yearTo: null,
      confidence: 0,
      modelCandidates: [],
      needsClarification: false,
      clarification: null,
      missingFields: [],
      narrowingHints: [],
    },
  };
}
