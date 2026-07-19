// ── Generation detection ───────────────────────────────────────────────────
// Turns "Golf 8" / "Golf Mk8" / "Golf VIII" / "Golf 8th gen" into the token "8".
//
// Deliberately conservative. A false positive is worse than a miss: providers
// only apply a generation when it maps to a VERIFIED slug, but a wrong token
// could still send us to the wrong generation page. So we only accept:
//   • an explicit marker  — mk8, mark 8, gen 8, generation 8, 8th gen
//   • a roman numeral     — golf viii
//   • a small trailing number directly after an alphabetic model — golf 8
//
// Things this must NOT treat as a generation:
//   "3 Series" / "seria-3"  → the number precedes the model word
//   "A4", "Q5", "C4"        → letter+digit is part of the model name
//   "Golf after 2019"       → 4-digit years are out of range
//   "Golf under 80000 km"   → out of range

const ROMAN: Record<string, string> = {
  i: "1", ii: "2", iii: "3", iv: "4", v: "5",
  vi: "6", vii: "7", viii: "8", ix: "9", x: "10",
};

/** Generations realistically run 1–12; anything else is a year, price or mileage. */
const MIN_GEN = 1;
const MAX_GEN = 12;

function inRange(value: string): boolean {
  const n = Number(value);
  return Number.isInteger(n) && n >= MIN_GEN && n <= MAX_GEN;
}

/**
 * @param model    resolved model display name, e.g. "Golf"
 * @param rawText  the user's original phrasing, e.g. "golf 8 in poland under 80k km"
 * @returns a bare generation token ("8") or null
 */
export function detectGeneration(model: string | null, rawText: string | null): string | null {
  const haystack = `${model ?? ""} ${rawText ?? ""}`.toLowerCase();
  if (!haystack.trim()) return null;

  // 1) Explicit markers: mk8 / mk 8 / mark 8 / gen 8 / generation 8
  const marker = haystack.match(/\b(?:mk|mark|gen|generation)\s*\.?\s*([0-9]{1,2})\b/);
  if (marker && inRange(marker[1])) return marker[1];

  // 2) Ordinal: "8th gen", "8th generation"
  const ordinal = haystack.match(/\b([0-9]{1,2})\s*(?:st|nd|rd|th)\s*gen(?:eration)?\b/);
  if (ordinal && inRange(ordinal[1])) return ordinal[1];

  // 3) Roman numeral straight after the model word: "golf viii"
  if (model) {
    const modelWord = model.toLowerCase().split(/\s+/)[0].replace(/[^a-z0-9]/g, "");
    if (modelWord) {
      const roman = haystack.match(
        new RegExp(`\\b${modelWord}\\s+(i{1,3}|iv|v|vi{1,3}|ix|x)\\b`),
      );
      if (roman) return ROMAN[roman[1]] ?? null;

      // 4) Small trailing number right after a purely alphabetic model name.
      //    Guarded so "a4 2019" or "seria 3" can't be misread.
      if (/^[a-z]+$/.test(modelWord)) {
        const trailing = haystack.match(new RegExp(`\\b${modelWord}\\s+([0-9]{1,2})\\b`));
        if (trailing && inRange(trailing[1])) return trailing[1];
      }
    }
  }

  return null;
}
