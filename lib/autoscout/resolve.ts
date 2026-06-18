// ── Generic vehicle resolver ───────────────────────────────────────────────
// Reads ONLY from taxonomy.ts. Resolves make → model family → trims/body-style,
// scores confidence, and surfaces ambiguity so the caller can ask for
// clarification instead of silently linking at brand level.
//
// Resolution order (deterministic, never guesses a slug):
//   1. make: explicit field, else scanned from free text.
//   2. model family: explicit `model` field first (highest signal), else free
//      text, else engine-badge inference. All matching is whole-word, longest
//      alias first, scoped to the resolved make's families.
//   3. body style + trims: metadata that refine the SAME family.
//
// Outcomes the caller cares about:
//   - one confident family   → modelSlug set, modelVerified true.
//   - several plausible families (ambiguous) → candidates[] + needsClarification.
//   - a model term given but unknown → modelSlug null (safe make-only fallback).
//   - no model term at all → make-only, no clarification needed.

import {
  BODY_ALIASES, ENGINE_INFERENCE, MAKE_ALIAS_INDEX, MAKE_BY_SLUG, TAXONOMY,
  type BodyStyle, type ModelFamily,
} from "./taxonomy";

export interface ResolvedVehicle {
  makeKey: string | null;
  make: string | null;        // display
  makeSlug: string | null;
  model: string | null;       // family display
  modelSlug: string | null;
  modelVerified: boolean;
  bodyStyle: BodyStyle | null;
  trims: string[];
  confidence: number;         // 0..1
  candidates: { display: string; slug: string }[];
  needsClarification: boolean;
  clarification: string | null;
  reason: string;             // short trace for debugging/telemetry
}

const clean = (s: unknown): string =>
  typeof s === "string" ? s.toLowerCase().trim().replace(/\s+/g, " ") : "";

const esc = (s: string) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");

/** Whole-word presence test (alias may contain spaces/hyphens/dots). */
function hasWord(text: string, alias: string): boolean {
  if (!text || !alias) return false;
  return new RegExp(`(^|[^a-z0-9])${esc(alias)}([^a-z0-9]|$)`, "i").test(text);
}

function resolveMakeKey(makeRaw: string, text: string): string | null {
  const m = clean(makeRaw);
  if (m && MAKE_ALIAS_INDEX[m]) return MAKE_ALIAS_INDEX[m];
  if (m && MAKE_BY_SLUG[m]) return m;
  // Scan free text — longest alias first so "mercedes-benz" beats "mercedes".
  const aliases = Object.keys(MAKE_ALIAS_INDEX).sort((a, b) => b.length - a.length);
  for (const a of aliases) if (hasWord(text, a)) return MAKE_ALIAS_INDEX[a];
  return null;
}

function resolveBodyStyle(text: string): BodyStyle | null {
  const aliases = Object.keys(BODY_ALIASES).sort((a, b) => b.length - a.length);
  for (const a of aliases) if (hasWord(text, a.replace(/_/g, " "))) return BODY_ALIASES[a];
  return null;
}

/** All families of a make whose aliases appear in `text` (whole-word, dedup by slug). */
function matchFamilies(make: { families: ModelFamily[] }, text: string): ModelFamily[] {
  if (!text) return [];
  const out: ModelFamily[] = [];
  const seen = new Set<string>();
  // Sort families by their longest alias desc so specific names win first.
  const ranked = [...make.families].sort(
    (a, b) => Math.max(...b.aliases.map((x) => x.length)) - Math.max(...a.aliases.map((x) => x.length)),
  );
  for (const fam of ranked) {
    if (fam.aliases.some((a) => hasWord(text, a)) && !seen.has(fam.slug)) {
      seen.add(fam.slug);
      out.push(fam);
    }
  }
  return out;
}

/** Find a trim mention within a family (for confidence + display). */
function matchTrims(fam: ModelFamily, text: string): string[] {
  if (!fam.trims) return [];
  return fam.trims.filter((tr) => hasWord(text, tr));
}

export function resolveVehicle(makeRaw: string | null | undefined, modelRaw: string | null | undefined, rawText: string | null | undefined): ResolvedVehicle {
  const text = clean(rawText);
  const modelText = clean(modelRaw);
  const combined = [modelText, text].filter(Boolean).join(" ");

  const empty: ResolvedVehicle = {
    makeKey: null, make: null, makeSlug: null, model: null, modelSlug: null,
    modelVerified: false, bodyStyle: null, trims: [], confidence: 0,
    candidates: [], needsClarification: false, clarification: null, reason: "no-make",
  };

  const makeKey = resolveMakeKey(clean(makeRaw), text);
  if (!makeKey) return { ...empty, reason: "no-make" };
  const make = MAKE_BY_SLUG[makeKey];

  const bodyStyle = resolveBodyStyle(combined);

  // 1) Family from the explicit model field (strongest signal).
  let matches = matchFamilies(make, modelText);
  let source: "model" | "text" | "engine" | "none" = matches.length ? "model" : "none";

  // 2) Family from free text (only if the model field gave nothing).
  if (matches.length === 0 && text) {
    matches = matchFamilies(make, text);
    if (matches.length) source = "text";
  }

  // 3) Engine-badge inference (e.g. "320d" → 3 Series, "c220d" → C-Class).
  if (matches.length === 0 && ENGINE_INFERENCE[makeKey]) {
    const tokens = combined.split(/[^a-z0-9]+/i).filter(Boolean);
    for (const tok of tokens) {
      const famAlias = ENGINE_INFERENCE[makeKey](tok);
      if (famAlias) {
        const fam = make.families.find((f) => f.aliases.includes(famAlias));
        if (fam) { matches = [fam]; source = "engine"; break; }
      }
    }
  }

  const baseMake = { makeKey, make: make.display, makeSlug: make.slug };

  // ── Ambiguous: more than one distinct family plausible → ask, don't guess.
  if (matches.length > 1) {
    const candidates = matches.slice(0, 4).map((f) => ({ display: f.display, slug: f.slug }));
    const names = candidates.map((c) => c.display);
    const list = names.length === 2 ? names.join(" or ") : `${names.slice(0, -1).join(", ")}, or ${names.at(-1)}`;
    return {
      ...empty, ...baseMake, bodyStyle, confidence: 0.4, candidates,
      needsClarification: true,
      clarification: `Which ${make.display} did you mean — ${list}?`,
      reason: "ambiguous-family",
    };
  }

  // ── Exactly one family → confident resolution.
  if (matches.length === 1) {
    const fam = matches[0];
    const trims = matchTrims(fam, combined);
    // Confidence: explicit model field > free text > engine inference; trims add a touch.
    let confidence = source === "model" ? 0.95 : source === "text" ? 0.85 : 0.72;
    if (trims.length) confidence = Math.min(0.98, confidence + 0.03);
    return {
      ...empty, ...baseMake,
      model: fam.display, modelSlug: fam.slug, modelVerified: true,
      bodyStyle, trims, confidence, reason: `family:${source}`,
    };
  }

  // ── A model term was given but matched nothing known → safe make-only.
  const modelTermGiven = modelText.length > 0;
  return {
    ...empty, ...baseMake, bodyStyle,
    model: modelTermGiven ? (modelRaw as string).trim() : null,
    modelSlug: null, modelVerified: false,
    confidence: modelTermGiven ? 0.45 : 0.6,
    reason: modelTermGiven ? "model-unknown" : "make-only",
  };
}

/** Convenience: list a make's family display names (for clarification UIs). */
export function familyNamesForMake(makeKey: string): string[] {
  return (MAKE_BY_SLUG[makeKey]?.families ?? []).map((f) => f.display);
}

export { TAXONOMY };
