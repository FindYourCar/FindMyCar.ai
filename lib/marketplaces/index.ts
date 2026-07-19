// ── Marketplace router + shared UI copy ────────────────────────────────────
// One place decides which marketplace serves a country, and one place decides
// what we tell the user about it. Both the chat bubble and the card read from
// here, so the text, the badge and the link can never disagree.

import type { Marketplace, MarketplaceProvider, MarketplaceSearchInput } from "./types";
import { autoScout24Provider } from "./autoscout24";
import { otomotoProvider } from "./otomoto";

export * from "./types";
export { autoScout24Provider, buildAutoScout24MakeOnly } from "./autoscout24";
export { otomotoProvider } from "./otomoto";
export { resolveModelImage, MODEL_IMAGE_PLACEHOLDER } from "./modelImage";
export type { ResolvedModelImage } from "./modelImage";
export { detectGeneration } from "./generation";

/** Country → provider. Poland is a first-class market, never a fallback. */
export function resolveMarketplaceProvider(
  input: Pick<MarketplaceSearchInput, "countryCode">,
): MarketplaceProvider {
  if (otomotoProvider.supportsCountry(input.countryCode)) return otomotoProvider;
  return autoScout24Provider;
}

/** Which marketplace serves a country, without building a URL. */
export function marketplaceForCountry(countryCode: string): Marketplace {
  return countryCode === "PL" ? "otomoto" : "autoscout24";
}

/** Human brand name for a marketplace. */
export function marketplaceBrand(marketplace: Marketplace): string {
  return marketplace === "otomoto" ? "Otomoto" : "AutoScout24";
}

/**
 * The single source of truth for the "I found a live …" line.
 * Used by the chat bubble AND above the card so they always match.
 */
export function getLiveMarketIntro(marketplace: Marketplace, countryCode: string): string {
  if (marketplace === "otomoto" && countryCode === "PL") {
    return "I found a live Otomoto search for your request. Open the verified results in the card below.";
  }
  if (marketplace === "autoscout24") {
    return "I found a live AutoScout24 search for your request. Open the verified results in the card below.";
  }
  return "I found a live marketplace search for your request.";
}

/** Short line shown under the "Live market links" heading. */
export function getLiveMarketSubtitle(marketplace: Marketplace): string {
  return marketplace === "otomoto"
    ? "Open real Otomoto results based on your recommendation."
    : "Open real AutoScout24 results based on your recommendation.";
}
