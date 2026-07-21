// ── Car image resolution ───────────────────────────────────────────────────
// The ONLY place that decides which picture a car gets. UI components call
// getCarImage() and render the result — no matching logic lives in components.
//
// Swapping to a paid automotive image API later means implementing
// getCarImageFromProvider() below and calling it from getCarImage(). No
// component changes, because the returned shape stays the same.

import {
  carImageMap,
  FALLBACK_IMAGE,
  FALLBACK_SVG,
  makeAliases,
  makeImageMap,
  type CarImageEntry,
} from "./carImageMap";

export * from "./carImageMap";

export interface CarImageQuery {
  make?: string | null;
  model?: string | null;
  /** Free text like "Volkswagen Golf" — used when make/model aren't split out. */
  title?: string | null;
}

export interface ResolvedCarImage {
  /** Path to render. */
  src: string;
  alt: string;
  /** Always exists — use as the <img onError> target so nothing ever breaks. */
  fallback: string;
  /** True when we fell back rather than matching a real model image. */
  isFallback: boolean;
  matchedBy: "model" | "alias" | "make" | "fallback";
}

/** lowercase, strip punctuation/accents, collapse whitespace. */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(RegExp(String.raw`\p{Diacritic}`, "gu"), "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Compare "3 Series" / "3-series" / "3series" as equal. */
function compact(value: string): string {
  return normalize(value).replace(/\s+/g, "");
}

function canonicalMake(make: string): string {
  const n = normalize(make);
  return makeAliases[n] ?? n.replace(/\s+/g, "-");
}

/**
 * Split a free-text title ("Volkswagen Golf 8") into make + model by matching
 * the first token(s) against known brands. Falls back to first word = make.
 */
function splitTitle(title: string): { make: string; model: string } {
  const n = normalize(title);
  // Longest alias first, so "mercedes benz a class" doesn't match bare
  // "mercedes" and leave "benz a class" as the model.
  const aliases = Object.keys(makeAliases).sort((a, b) => b.length - a.length);
  for (const alias of aliases) {
    if (n === alias || n.startsWith(`${alias} `)) {
      return { make: alias, model: n.slice(alias.length).trim() };
    }
  }
  const [first, ...rest] = n.split(" ");
  return { make: first ?? "", model: rest.join(" ") };
}

function matchEntry(make: string, model: string): { entry: CarImageEntry; via: "model" | "alias" } | null {
  const m = canonicalMake(make);
  const wanted = compact(model);
  if (!wanted) return null;

  const brandEntries = carImageMap.filter((e) => canonicalMake(e.make) === m);

  // 1) exact model match
  const exact = brandEntries.find((e) => compact(e.model) === wanted);
  if (exact) return { entry: exact, via: "model" };

  // 2) alias match
  const aliased = brandEntries.find((e) => (e.aliases ?? []).some((a) => compact(a) === wanted));
  if (aliased) return { entry: aliased, via: "alias" };

  // 3) model name is a prefix of the request ("Golf GTI DSG" → Golf).
  //    Deliberately loose: a clean same-model photo beats the placeholder.
  const prefixed = brandEntries.find((e) => wanted.startsWith(compact(e.model)));
  if (prefixed) return { entry: prefixed, via: "alias" };

  return null;
}

export function getCarImage({ make, model, title }: CarImageQuery): ResolvedCarImage {
  let resolvedMake = (make ?? "").trim();
  let resolvedModel = (model ?? "").trim();

  // Derive from the title when we weren't given structured fields.
  if ((!resolvedMake || !resolvedModel) && title) {
    const parts = splitTitle(title);
    if (!resolvedMake) resolvedMake = parts.make;
    if (!resolvedModel) resolvedModel = parts.model;
  }

  const alt = [resolvedMake, resolvedModel].filter(Boolean).join(" ").trim() || "Car";

  if (resolvedMake) {
    const hit = matchEntry(resolvedMake, resolvedModel);
    if (hit) {
      return { src: hit.entry.image, alt, fallback: FALLBACK_SVG, isFallback: false, matchedBy: hit.via };
    }

    const makeImage = makeImageMap[canonicalMake(resolvedMake)];
    if (makeImage) {
      return { src: makeImage, alt, fallback: FALLBACK_SVG, isFallback: true, matchedBy: "make" };
    }
  }

  return { src: FALLBACK_IMAGE, alt, fallback: FALLBACK_SVG, isFallback: true, matchedBy: "fallback" };
}

/**
 * Seam for a future paid automotive image API (e.g. a licensed CDN keyed by
 * make/model/year). Implement this and call it from getCarImage() before the
 * catalog lookup — the UI contract does not change.
 *
 * Must return watermark-free imagery only; a watermarked "exact" render is
 * worse than a clean representative photo.
 */
export async function getCarImageFromProvider(
  query: CarImageQuery,
): Promise<ResolvedCarImage | null> {
  void query; // seam: signature is the contract; the stub has nothing to call yet.
  return null;
}
