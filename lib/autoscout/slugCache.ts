// ── Resolved-slug cache ────────────────────────────────────────────────────
// Makes Tier-2 live resolution pay-once: a validated (make, family) → slug pair
// is remembered so the long tail resolves instantly on repeat. Known MISSES are
// cached as null too, so we don't re-probe a dead name every time.
//
// Process-lifetime in-memory map. On serverless this resets per cold start,
// which is fine (correctness comes from validation, not the cache). Swap the
// Map for Vercel KV / Redis here if cross-instance persistence is wanted.

const cache = new Map<string, string | null>();

function key(makeSlug: string, name: string): string {
  return `${makeSlug}:${name.toLowerCase().trim().replace(/\s+/g, " ")}`;
}

export function hasCachedSlug(makeSlug: string, name: string): boolean {
  return cache.has(key(makeSlug, name));
}
export function getCachedSlug(makeSlug: string, name: string): string | null {
  return cache.get(key(makeSlug, name)) ?? null;
}
export function setCachedSlug(makeSlug: string, name: string, slug: string | null): void {
  cache.set(key(makeSlug, name), slug);
}
