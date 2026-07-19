// ── Model-correct image resolver ───────────────────────────────────────────
// The card's picture must agree with its title. Previously the image map held
// unverified stock photos — "volkswagen:golf" pointed at an Unsplash shot that
// is actually a Ford Mustang, which is exactly the bug this file exists to make
// impossible.
//
// Rules:
//  1. Only CURATED, self-hosted assets under /images/models/ are ever named.
//     We never point at a third-party stock photo we cannot verify.
//  2. Resolution is most-specific-first: make+model+generation → make+model →
//     the conventional filename → a neutral, brand-free placeholder.
//  3. The placeholder is a local SVG we control, so the worst case is a tasteful
//     silhouette — never another manufacturer's car.
//
// Adding a real photo is a drop-in: put the file at the conventional path
// (see CONVENTION below) or add an explicit MODEL_IMAGE_MAP entry. No code change.

/** Neutral, brand-free fallback. Local + committed, so it always resolves. */
export const MODEL_IMAGE_PLACEHOLDER = "/images/models/_placeholder.svg";

/**
 * Curated overrides, keyed by a normalized "make-model[-generation]" token.
 * Only add an entry once the asset actually exists in /public/images/models/
 * AND you have confirmed the photo shows that exact car.
 */
const MODEL_IMAGE_MAP: Record<string, string> = {
  // Seeded intentionally empty of stock photos. Add verified assets like:
  // "volkswagen-golf-8": "/images/models/vw-golf-8.jpg",
  // "volkswagen-golf-7": "/images/models/vw-golf-7.jpg",
  // "toyota-yaris-4":    "/images/models/toyota-yaris-4.jpg",
};

export interface ResolvedModelImage {
  /** First choice. */
  url: string;
  /** Tried in order by the client if `url` fails to load. */
  fallbacks: string[];
  alt: string;
  /** True when we ended up on the neutral placeholder. */
  isPlaceholder: boolean;
}

function token(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Reduce a free-text generation ("Mk8", "VIII", "8th gen") to a bare number so
 * "Golf 8", "Golf VIII" and "Golf Mk8" all resolve to the same asset key.
 */
const ROMAN: Record<string, string> = {
  i: "1", ii: "2", iii: "3", iv: "4", v: "5",
  vi: "6", vii: "7", viii: "8", ix: "9", x: "10",
};

function generationToken(generation: string): string {
  const raw = token(generation)
    .replace(/^(mk|mark|gen|generation)-?/, "")
    .replace(/-?(th|st|nd|rd)-?(gen|generation)?$/, "");
  return ROMAN[raw] ?? raw;
}

/**
 * CONVENTION: /images/models/{make}-{model}[-{generation}].jpg
 * e.g. /images/models/volkswagen-golf-8.jpg
 */
function conventionalPath(parts: string[]): string {
  return `/images/models/${parts.join("-")}.jpg`;
}

export function resolveModelImage(
  make: string | null,
  model: string | null,
  generation?: string | null,
): ResolvedModelImage {
  const alt = [make, model, generation].filter(Boolean).join(" ").trim() || "Car marketplace search";

  if (!make) {
    return { url: MODEL_IMAGE_PLACEHOLDER, fallbacks: [], alt, isPlaceholder: true };
  }

  const makeT = token(make);
  const modelT = model ? token(model) : null;
  const genT = generation ? generationToken(generation) : null;

  // Build candidate keys, most specific first.
  const keys: string[][] = [];
  if (modelT && genT) keys.push([makeT, modelT, genT]);
  if (modelT) keys.push([makeT, modelT]);

  const candidates: string[] = [];
  for (const parts of keys) {
    const curated = MODEL_IMAGE_MAP[parts.join("-")];
    if (curated) candidates.push(curated);
    candidates.push(conventionalPath(parts));
  }

  // De-duplicate while preserving order.
  const ordered = candidates.filter((c, i) => candidates.indexOf(c) === i);

  if (ordered.length === 0) {
    return { url: MODEL_IMAGE_PLACEHOLDER, fallbacks: [], alt, isPlaceholder: true };
  }

  return {
    url: ordered[0],
    // Always end on the placeholder so a missing asset degrades to a neutral
    // graphic rather than a broken image icon — or worse, the wrong car.
    fallbacks: [...ordered.slice(1), MODEL_IMAGE_PLACEHOLDER],
    alt,
    isPlaceholder: false,
  };
}
