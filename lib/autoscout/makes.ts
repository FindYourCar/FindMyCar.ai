// ── Make namespace ─────────────────────────────────────────────────────────
// The set of car BRANDS is finite and stable (one screen of AutoScout's "Alle
// Marken" list), so enumerating it is a bounded namespace — NOT per-model
// hardcoding. The rich per-model taxonomy lives in taxonomy.ts; this file just
// guarantees the resolver can recognize a make and produce its AutoScout slug
// even for brands without a curated family list. Model slugs for those brands
// are then resolved live (liveResolve.ts) from the extracted family name.
//
// slug = the AutoScout24 make path segment. Most are the lowercased brand;
// multi-word / special cases are explicit.

export interface MakeRef {
  display: string;
  slug: string;
}

// alias (lowercased; misspellings welcome) → { display, slug }
export const ALL_MAKES: Record<string, MakeRef> = (() => {
  // [canonical display, slug, ...aliases]
  const rows: [string, string, ...string[]][] = [
    ["Abarth", "abarth"],
    ["Alfa Romeo", "alfa-romeo", "alfa romeo", "alfa", "alfaromeo"],
    ["Alpine", "alpine"],
    ["Aston Martin", "aston-martin", "aston martin", "aston"],
    ["Audi", "audi"],
    ["Bentley", "bentley"],
    ["BMW", "bmw", "beemer", "bimmer"],
    ["BYD", "byd"],
    ["Chevrolet", "chevrolet", "chevy"],
    ["Chrysler", "chrysler"],
    ["Citroën", "citroen", "citroën"],
    ["Cupra", "cupra"],
    ["Dacia", "dacia"],
    ["DS Automobiles", "ds-automobiles", "ds", "ds automobiles"],
    ["Fiat", "fiat"],
    ["Ford", "ford"],
    ["Honda", "honda"],
    ["Hyundai", "hyundai", "hyundi"],
    ["Jaguar", "jaguar", "jag"],
    ["Jeep", "jeep"],
    ["Kia", "kia"],
    ["Land Rover", "land-rover", "land rover", "landrover", "range rover", "range-rover"],
    ["Lexus", "lexus"],
    ["Maserati", "maserati"],
    ["Mazda", "mazda"],
    ["Mercedes-Benz", "mercedes-benz", "mercedes", "mercedes benz", "mercedez", "merc", "benz", "mb"],
    ["MG", "mg"],
    ["MINI", "mini"],
    ["Mitsubishi", "mitsubishi"],
    ["Nissan", "nissan"],
    ["Opel", "opel", "vauxhall"],
    ["Peugeot", "peugeot", "peugot"],
    ["Polestar", "polestar"],
    ["Porsche", "porsche"],
    ["Renault", "renault", "renaut"],
    ["Saab", "saab"],
    ["SEAT", "seat"],
    ["Škoda", "skoda", "škoda"],
    ["Smart", "smart"],
    ["Subaru", "subaru"],
    ["Suzuki", "suzuki"],
    ["Tesla", "tesla"],
    ["Toyota", "toyota", "toyta"],
    ["Volkswagen", "volkswagen", "vw", "volkswagon"],
    ["Volvo", "volvo"],
  ];
  const map: Record<string, MakeRef> = {};
  for (const [display, slug, ...aliases] of rows) {
    const ref = { display, slug };
    map[slug] = ref;
    map[display.toLowerCase()] = ref;
    for (const a of aliases) map[a.toLowerCase()] = ref;
  }
  return map;
})();

/** Kebab-case a free make string into a plausible AutoScout make slug. */
export function makeSlugFrom(raw: string): string {
  return (raw || "")
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
