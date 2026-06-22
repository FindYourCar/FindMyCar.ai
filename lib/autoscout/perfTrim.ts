// ── Tier-A performance / halo trim detection ───────────────────────────────
// Performance trims (M, AMG, R, GTI, RS, vRS, OPC, Type R, GR, N, Quadrifoglio…)
// are often a DISTINCT AutoScout model family (/lst/bmw/m6, /lst/volkswagen/
// golf-r) rather than the base family. This module turns a request into ordered
// candidate performance-family slugs + a display label. It is a general PATTERN
// CLASS, not a finite car list: it proposes candidates and the live subset check
// (resolvePerformanceSlug in liveResolve.ts) decides which actually exist — so a
// brand WITHOUT a distinct perf family (e.g. AutoScout has no octavia-rs) simply
// fails validation and the caller degrades honestly to base family + a hint.

export interface PerfTrim {
  label: string;        // display, e.g. "M6", "Golf R", "RS3", "C 63 AMG"
  candidates: string[]; // slug candidates to validate, best-first
}

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const has = (t: string, re: RegExp) => re.test(t);

export function detectPerformanceTrim(
  makeSlug: string | null | undefined,
  baseSlug: string | null | undefined,
  baseDisplay: string | null | undefined,
  rawText: string | null | undefined,
): PerfTrim | null {
  const t = (rawText || "").toLowerCase();
  const mk = makeSlug || "";
  const base = (baseSlug || "").toLowerCase();
  const baseName = baseDisplay || cap(base);
  if (!t || !mk) return null;

  // ── Brand-scoped STANDALONE perf families (don't need a base family) ──
  if (mk === "bmw") {
    // Full M only (M2..M8). "M340i"/"M Sport" are M-Performance → base + hint.
    const m = t.match(/\bm\s?([2-8])\b/);
    if (m) return { label: `M${m[1]}`, candidates: [`m${m[1]}`] };
  }
  if (mk === "mercedes-benz") {
    // "c 63 amg", "a 45 amg", "e 53 amg", "g 63 amg"
    const m = t.match(/\b([abcegs])[\s-]?(\d{2})\s?amg\b/);
    if (m) return { label: `${m[1].toUpperCase()} ${m[2]} AMG`, candidates: [`${m[1]}-${m[2]}-amg`] };
  }
  if (mk === "audi") {
    let m = t.match(/\brs\s?(\d)\b/);
    if (m) return { label: `RS${m[1]}`, candidates: [`rs${m[1]}`, `rs-${m[1]}`] };
    m = t.match(/\bsq\s?([2-8])\b/);
    if (m) return { label: `SQ${m[1]}`, candidates: [`sq${m[1]}`] };
    m = t.match(/\bs\s?([1-8])\b/);
    if (m) return { label: `S${m[1]}`, candidates: [`s${m[1]}`] };
  }

  // ── BASE + suffix perf families (need the resolved base family slug) ──
  if (base) {
    let m = t.match(/\b(gti|gtd|gte)\b/);
    if (m) return { label: `${baseName} ${m[1].toUpperCase()}`, candidates: [`${base}-${m[1]}`] };

    if (mk === "volkswagen" && has(t, /\br\b(?!\s*-?\s*line)/)) {
      return { label: `${baseName} R`, candidates: [`${base}-r`] };
    }
    if (has(t, /\bvrs\b/) || (mk === "skoda" && has(t, /\brs\b/))) {
      return { label: `${baseName} vRS`, candidates: [`${base}-rs`, `${base}-vrs`] };
    }
    if (has(t, /\bopc\b/)) return { label: `${baseName} OPC`, candidates: [`${base}-opc`] };
    if (has(t, /\btype[\s-]?r\b/)) return { label: `${baseName} Type R`, candidates: [`${base}-type-r`] };
    if (mk === "toyota" && has(t, /\bgr\b/)) return { label: `GR ${baseName}`, candidates: [`gr-${base}`, `${base}-gr`] };
    if (mk === "hyundai" && has(t, /\bn\b/)) return { label: `${baseName} N`, candidates: [`${base}-n`] };
    if (has(t, /\bquadrifoglio\b|\bqv\b/)) return { label: `${baseName} Quadrifoglio`, candidates: [`${base}-quadrifoglio`] };
  }

  return null;
}
