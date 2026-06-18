// POST /api/market-search
// The ONLY place AutoScout24 URLs are built + validated. Frontend sends a loose
// RawCarIntent; we normalize → build → validate → (degrade on dead) → attach a
// model image, and return a MarketSearchResult the card can render safely.

import { NextResponse } from "next/server";
import type { MarketSearchResult, RawCarIntent } from "@/lib/autoscout/types";
import { normalizeIntent } from "@/lib/autoscout/normalize";
import { buildAutoscoutUrl } from "@/lib/autoscout/buildUrl";
import { validateAutoscoutUrl } from "@/lib/autoscout/validate";
import { resolveCarImage } from "@/lib/autoscout/image";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let raw: RawCarIntent;
  try {
    raw = (await req.json()) as RawCarIntent;
  } catch {
    return NextResponse.json(errorResult("Invalid request body."), { status: 400 });
  }

  const intent = normalizeIntent(raw);
  const image = resolveCarImage(intent);
  const title = [intent.make, intent.model].filter(Boolean).join(" ").trim();

  // Ambiguous model (e.g. two plausible families) → ask instead of guessing wrong.
  if (intent.needsClarification && intent.modelCandidates.length > 0) {
    return NextResponse.json({
      ...baseResult(intent, image),
      status: "needs_clarification" as const,
      title: title || `${intent.make ?? "Car"} — which model?`,
      note: intent.clarification ?? "Which model did you mean?",
    });
  }

  // Need at least a make (or a numeric filter) to produce a useful link.
  const hasAnyFilter =
    intent.makeSlug || intent.maxMileage || intent.maxPrice || intent.minPrice ||
    intent.yearFrom || intent.fuel || intent.transmission;
  if (!hasAnyFilter) {
    return NextResponse.json(
      noMatchResult(intent, image, "We couldn’t pull structured filters from that request — try naming a brand, budget, or mileage."),
    );
  }

  // 1) Best-precision URL (make + verified model when available).
  const primary = buildAutoscoutUrl(intent);
  let finalUrl = primary.url;
  let degraded = primary.degraded;
  let degradeReason = primary.degradeReason;
  let verified = false;

  const state = await validateAutoscoutUrl(primary.url);
  if (state === "ok") {
    verified = true;
  } else if (state === "dead" && primary.hasModelPath) {
    // 2) Model page is dead → fall back to make-only (reliably resolves).
    const makeOnly = buildAutoscoutUrl(intent, { forceMakeOnly: true });
    const makeState = await validateAutoscoutUrl(makeOnly.url);
    finalUrl = makeOnly.url;
    degraded = true;
    degradeReason = makeOnly.degradeReason ??
      `Exact ${title || "model"} page was unavailable — showing all ${intent.make ?? "matching"} results.`;
    verified = makeState === "ok";
  } else if (state === "dead") {
    // Make-level path itself dead (rare) → general country search.
    const general = buildAutoscoutUrl({ ...intent, makeSlug: null, modelSlug: null, modelVerified: false });
    finalUrl = general.url;
    degraded = true;
    degradeReason = "Exact results were unavailable — showing the broader market search.";
    verified = (await validateAutoscoutUrl(general.url)) === "ok";
  }
  // state === "inconclusive": keep the registry-built URL, verified stays false.

  const result: MarketSearchResult = {
    status: "success",
    url: finalUrl,
    verified,
    degraded,
    degradeReason,
    title: title || "Live market search",
    intent,
    image,
    note: !verified && degraded === false ? "Link built from verified data (live check skipped)." : null,
  };
  return NextResponse.json(result);
}

function baseResult(intent: MarketSearchResult["intent"], image: MarketSearchResult["image"]) {
  return { url: null, verified: false, degraded: false, degradeReason: null, intent, image };
}
function noMatchResult(intent: MarketSearchResult["intent"], image: MarketSearchResult["image"], note: string): MarketSearchResult {
  return { ...baseResult(intent, image), status: "no_match", title: "No structured match", note };
}
function errorResult(note: string): MarketSearchResult {
  return {
    status: "error", url: null, verified: false, degraded: false, degradeReason: null,
    title: "Search error", note,
    intent: {
      make: null, makeSlug: null, model: null, modelSlug: null, modelVerified: false,
      bodyStyle: null, trims: [], country: "NL", countryLabel: "Netherlands", maxMileage: null,
      minPrice: null, maxPrice: null, fuel: null, transmission: null, yearFrom: null, yearTo: null,
      confidence: 0, modelCandidates: [], needsClarification: false, clarification: null, missingFields: [],
    },
    image: { primary: "", fallbacks: [], alt: "" },
  };
}
