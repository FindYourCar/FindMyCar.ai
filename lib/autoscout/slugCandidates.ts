// ── Model slug candidate generation ────────────────────────────────────────
// Turns a canonical model-family NAME (as understood by the extractor's car
// knowledge, e.g. "Giulia", "MX-5", "RAV4", "595 Turismo", "C-Class", "3 Series")
// into an ORDERED list of plausible AutoScout (.de) path slugs, using a small set
// of provider-general transforms — NOT a per-car table. liveResolve.ts probes
// these against the real site and keeps the first that resolves.

export function generateSlugCandidates(rawName: string): string[] {
  const name = (rawName || "").toLowerCase().trim().replace(/\s+/g, " ");
  if (!name) return [];

  const out: string[] = [];
  const push = (s: string) => {
    const clean = s.replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
    if (clean && !out.includes(clean)) out.push(clean);
  };

  // 1. straight kebab: "595 turismo"→"595-turismo", "mx-5"→"mx-5", "giulia"→"giulia"
  push(name.replace(/\s+/g, "-"));
  // 2. no separators: "mx-5"→"mx5", "595 turismo"→"595turismo"
  push(name.replace(/[\s-]+/g, ""));
  // 3. German "Klasse" + English "class": "c-class"→"c-klasse"/"c-class"
  const cls = name.match(/^([a-z0-9]+)[\s-]?class$/);
  if (cls) { push(`${cls[1]}-klasse`); push(`${cls[1]}-class`); }
  // 4. German "Ner" + English "series": "3 series"→"3er"/"3-series"
  const ser = name.match(/^(\d+)[\s-]?series$/);
  if (ser) { push(`${ser[1]}er`); push(`${ser[1]}-series`); }
  // 5. letter/digit boundary hyphenation: "rav4"→"rav-4", "cx30"→"cx-30"
  push(name.replace(/([a-z])(\d)/g, "$1-$2").replace(/(\d)([a-z])/g, "$1-$2").replace(/\s+/g, "-"));
  // 6. first token of a multiword name: "595 turismo"→"595" (trim may be separate)
  if (name.includes(" ")) push(name.split(" ")[0]);

  return out.slice(0, 6);
}
