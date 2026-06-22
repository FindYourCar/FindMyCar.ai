// ── Tier 2: live slug resolution ───────────────────────────────────────────
// For a make + model-family NAME that the curated taxonomy didn't map to a
// verified slug, generate candidate slugs and probe AutoScout to find the one
// that actually resolves. Results (hits AND misses) are cached. Nothing is ever
// returned unless the live site confirmed it — so a guessed, unvalidated slug is
// never handed back to the URL builder.

import { AUTOSCOUT_BASE } from "./registry";
import { validateAutoscoutUrl, fetchOfferCount } from "./validate";
import { generateSlugCandidates } from "./slugCandidates";
import { getCachedSlug, hasCachedSlug, setCachedSlug } from "./slugCache";
import { makeSlugFrom } from "./makes";

export interface LiveSlug {
  slug: string;
  verified: boolean;
  source: "cache" | "live";
  candidates: string[];
}

/** Resolve a model-family name to a verified AutoScout slug, or null. */
export async function resolveModelSlugLive(
  makeSlug: string | null | undefined,
  modelName: string | null | undefined,
  timeoutMs = 6000,
): Promise<LiveSlug | null> {
  if (!makeSlug || !modelName) return null;

  // Probe at most 4 candidates to bound worst-case latency (serverless limit).
  const candidates = generateSlugCandidates(modelName).slice(0, 4);
  if (candidates.length === 0) return null;

  if (hasCachedSlug(makeSlug, modelName)) {
    const cached = getCachedSlug(makeSlug, modelName);
    return cached ? { slug: cached, verified: true, source: "cache", candidates } : null;
  }

  // Make total: a REAL model page is a strict subset of it; a bogus slug under a
  // real make silently serves the full make-level results (count == make total),
  // so we accept a candidate only when its count is > 0 AND below the make total.
  // NB: only POSITIVE results are cached (verified slugs / make totals). A
  // transient fetch failure must never be remembered as a permanent miss.
  let makeTotal: number | null = hasCachedSlug("_total", makeSlug)
    ? Number(getCachedSlug("_total", makeSlug))
    : null;
  if (makeTotal == null) {
    makeTotal = await fetchOfferCount(`${AUTOSCOUT_BASE}/${makeSlug}?atype=C`, timeoutMs);
    if (makeTotal != null) setCachedSlug("_total", makeSlug, String(makeTotal));
  }
  // Can't establish the make baseline → degrade rather than risk a bad slug.
  if (makeTotal == null) return null;

  for (const cand of candidates) {
    const count = await fetchOfferCount(`${AUTOSCOUT_BASE}/${makeSlug}/${cand}?atype=C`, timeoutMs);
    // Real model = a strict subset of the make. Equal count = soft make-fallback.
    if (count != null && count > 0 && count < makeTotal) {
      setCachedSlug(makeSlug, modelName, cand);
      return { slug: cand, verified: true, source: "live", candidates };
    }
  }
  return null;
}

/** Validate explicit performance-family slug candidates (e.g. m6, golf-r) with
 *  the same strict-subset rule. Returns the first that is a real subset of the
 *  make total (so a soft make-fallback like /audi/rs-3 == all-Audi is rejected). */
export async function resolvePerformanceSlug(
  makeSlug: string | null | undefined,
  candidates: string[] | null | undefined,
  timeoutMs = 6000,
): Promise<{ slug: string; count: number } | null> {
  if (!makeSlug || !candidates || candidates.length === 0) return null;

  let makeTotal: number | null = hasCachedSlug("_total", makeSlug)
    ? Number(getCachedSlug("_total", makeSlug))
    : null;
  if (makeTotal == null) {
    makeTotal = await fetchOfferCount(`${AUTOSCOUT_BASE}/${makeSlug}?atype=C`, timeoutMs);
    if (makeTotal != null) setCachedSlug("_total", makeSlug, String(makeTotal));
  }
  if (makeTotal == null) return null;

  for (const cand of candidates.slice(0, 3)) {
    const count = await fetchOfferCount(`${AUTOSCOUT_BASE}/${makeSlug}/${cand}?atype=C`, timeoutMs);
    if (count != null && count > 0 && count < makeTotal) return { slug: cand, count };
  }
  return null;
}

/** Resolve an unknown make NAME to a verified AutoScout make slug, or null. */
export async function resolveMakeSlugLive(
  makeName: string | null | undefined,
  timeoutMs = 6000,
): Promise<string | null> {
  if (!makeName) return null;
  const slug = makeSlugFrom(makeName);
  if (!slug) return null;
  if (hasCachedSlug("_make", slug)) {
    return getCachedSlug("_make", slug);
  }
  const state = await validateAutoscoutUrl(`${AUTOSCOUT_BASE}/${slug}?atype=C`, timeoutMs);
  if (state === "ok") { setCachedSlug("_make", slug, slug); return slug; }
  return null; // don't cache misses (could be transient)
}
