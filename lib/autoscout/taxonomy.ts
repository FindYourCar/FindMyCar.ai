// ── Scalable vehicle taxonomy ──────────────────────────────────────────────
// The single source of truth for make / model-family / alias / trim / body-style
// knowledge. NOT a switch statement and NOT brand-specific logic — the resolver
// (resolve.ts) is generic and reads only from this data, so adding a brand or
// model is a pure data edit here.
//
// Design:
//   make  → { slug, display, aliases[], families[] }
//   family→ { slug, display, aliases[], trims[], bodyStyles[] }
//   - aliases   : every way a user might type the family (spacing, misspellings,
//                 engine-badge stems). Matched as whole words, longest-first.
//   - trims     : performance/equipment lines — used for confidence + display,
//                 never to pick a different AutoScout path.
//   - bodyStyles: family-specific extra body words (most live in BODY_ALIASES).
//
// Body style is metadata that refines the SAME family (Golf vs Golf Variant are
// both `golf` + a body filter), so it never changes the model slug.

export interface ModelFamily {
  slug: string;        // AutoScout path slug, e.g. "c-class"
  display: string;     // "C-Class"
  aliases: string[];   // ["c-class","c class","cclass","c-klasse"]
  trims?: string[];    // ["c43","c63","amg","c220","c300"]
}

export interface MakeTaxonomy {
  slug: string;
  display: string;
  aliases: string[];
  families: ModelFamily[];
}

// Canonical body style → AutoScout `body` code. ⚙️ ADJUST IF NEEDED.
export type BodyStyle = "hatchback" | "sedan" | "estate" | "suv" | "coupe" | "cabriolet" | "mpv" | "van";

export const BODY_CODES: Record<BodyStyle, string> = {
  hatchback: "1",   // Compact
  cabriolet: "2",   // Convertible
  coupe: "3",
  suv: "4",         // SUV/Off-road
  estate: "5",      // Station wagon
  sedan: "6",       // Sedan/Saloon
  van: "8",
  mpv: "7",         // Other/MPV
};

// Body-style words → canonical BodyStyle. Matched whole-word, longest-first.
export const BODY_ALIASES: Record<string, BodyStyle> = {
  variant: "estate", avant: "estate", touring: "estate", kombi: "estate", combi: "estate",
  estate: "estate", wagon: "estate", "station wagon": "estate", "sports tourer": "estate",
  "shooting brake": "estate", sw: "estate", "sportwagon": "estate",
  sedan: "sedan", saloon: "sedan", limousine: "sedan", berline: "sedan", notchback: "sedan",
  hatch: "hatchback", hatchback: "hatchback", sportback: "hatchback",
  coupe: "coupe", "coupé": "coupe", gran_coupe: "coupe",
  cabriolet: "cabriolet", cabrio: "cabriolet", convertible: "cabriolet",
  roadster: "cabriolet", spider: "cabriolet", spyder: "cabriolet",
  suv: "suv", crossover: "suv", offroad: "suv", "off-road": "suv",
  mpv: "mpv", "people carrier": "mpv", minivan: "mpv",
  van: "van", panel: "van",
};

// Per-make engine-badge → family inference. Returns a family alias to look up.
// Only the brands whose users type bare engine codes need this; everything else
// resolves by alias. Generic shape: { makeSlug: (badge) => familyAliasOrNull }.
export const ENGINE_INFERENCE: Record<string, (badge: string) => string | null> = {
  // Mercedes: "c220d", "e350e", "a200" → first letter + "-class"
  "mercedes-benz": (b) => {
    const m = b.match(/^([abces])\s?\d{3}\b/i);
    return m ? `${m[1].toLowerCase()}-class` : null;
  },
  // BMW: "320d", "530e", "118i", bare "540" → first digit + " series"
  bmw: (b) => {
    const m = b.match(/^([1-8])\d{2}\s?[dietx]?\b/i);
    return m ? `${m[1]} series` : null;
  },
  // Audi: "a4 40 tdi" etc. — the family token (a4/a6/q5) is itself the alias, so
  // inference only needs to catch "s4"/"rs6" performance badges → base family.
  audi: (b) => {
    const m = b.match(/^(?:s|rs)([1-8])\b/i);
    return m ? `a${m[1]}` : null;
  },
};

export const TAXONOMY: MakeTaxonomy[] = [
  {
    slug: "mercedes-benz",
    display: "Mercedes-Benz",
    aliases: ["mercedes-benz", "mercedes benz", "mercedes", "mercedez", "merc", "benz", "mb"],
    families: [
      // NOTE: autoscout24.com uses German model slugs (c-klasse, not c-class).
      // `display` stays English; `slug` is the verified AutoScout path.
      { slug: "a-klasse", display: "A-Class", aliases: ["a-class", "a class", "aclass", "a-klasse"], trims: ["a35", "a45", "amg"] },
      { slug: "b-klasse", display: "B-Class", aliases: ["b-class", "b class", "bclass", "b-klasse"] },
      { slug: "c-klasse", display: "C-Class", aliases: ["c-class", "c class", "cclass", "c-klasse"], trims: ["c43", "c63", "amg", "c200", "c220", "c300"] },
      { slug: "e-klasse", display: "E-Class", aliases: ["e-class", "e class", "eclass", "e-klasse"], trims: ["e53", "e63", "amg", "e220", "e300"] },
      { slug: "s-klasse", display: "S-Class", aliases: ["s-class", "s class", "sclass", "s-klasse"], trims: ["s500", "s63", "amg"] },
      { slug: "cla", display: "CLA", aliases: ["cla", "cla-class", "cla class"], trims: ["cla45", "amg"] },
      { slug: "cls", display: "CLS", aliases: ["cls", "cls-class"] },
      { slug: "cle", display: "CLE", aliases: ["cle", "cle-class", "cle class"] },
      { slug: "gla", display: "GLA", aliases: ["gla", "gla-class"] },
      { slug: "glb", display: "GLB", aliases: ["glb", "glb-class"] },
      { slug: "glc", display: "GLC", aliases: ["glc", "glc-class"] },
      { slug: "gle", display: "GLE", aliases: ["gle", "gle-class", "ml", "m-class"] },
      { slug: "gls", display: "GLS", aliases: ["gls", "gls-class"] },
      { slug: "g-class", display: "G-Class", aliases: ["g-class", "g class", "g-klasse", "g wagon", "g-wagon", "gwagon"], trims: ["g63", "amg"] },
      { slug: "eqa", display: "EQA", aliases: ["eqa"] },
      { slug: "eqb", display: "EQB", aliases: ["eqb"] },
      { slug: "eqc", display: "EQC", aliases: ["eqc"] },
      { slug: "eqe", display: "EQE", aliases: ["eqe"] },
      { slug: "eqs", display: "EQS", aliases: ["eqs"] },
    ],
  },
  {
    slug: "bmw",
    display: "BMW",
    aliases: ["bmw", "beemer", "bimmer"],
    families: [
      { slug: "1er", display: "1 Series", aliases: ["1 series", "1-series", "1er", "1series"] },
      { slug: "2er", display: "2 Series", aliases: ["2 series", "2-series", "2er", "2series"] },
      { slug: "3er", display: "3 Series", aliases: ["3 series", "3-series", "3er", "3series"], trims: ["m3", "330e", "320d", "330i"] },
      { slug: "4er", display: "4 Series", aliases: ["4 series", "4-series", "4er"], trims: ["m4"] },
      { slug: "5er", display: "5 Series", aliases: ["5 series", "5-series", "5er", "5series"], trims: ["m5", "540i", "530e", "520d"] },
      { slug: "6er", display: "6 Series", aliases: ["6 series", "6-series", "6er"] },
      { slug: "7er", display: "7 Series", aliases: ["7 series", "7-series", "7er"] },
      { slug: "8er", display: "8 Series", aliases: ["8 series", "8-series", "8er"], trims: ["m8"] },
      { slug: "x1", display: "X1", aliases: ["x1"] },
      { slug: "x2", display: "X2", aliases: ["x2"] },
      { slug: "x3", display: "X3", aliases: ["x3"], trims: ["x3m"] },
      { slug: "x4", display: "X4", aliases: ["x4"] },
      { slug: "x5", display: "X5", aliases: ["x5"], trims: ["x5m"] },
      { slug: "x6", display: "X6", aliases: ["x6"] },
      { slug: "x7", display: "X7", aliases: ["x7"] },
      { slug: "i3", display: "i3", aliases: ["i3"] },
      { slug: "i4", display: "i4", aliases: ["i4"] },
      { slug: "i5", display: "i5", aliases: ["i5"] },
      { slug: "i7", display: "i7", aliases: ["i7"] },
      { slug: "ix", display: "iX", aliases: ["ix"] },
      { slug: "ix3", display: "iX3", aliases: ["ix3"] },
      { slug: "z4", display: "Z4", aliases: ["z4"] },
    ],
  },
  {
    slug: "audi",
    display: "Audi",
    aliases: ["audi"],
    families: [
      { slug: "a1", display: "A1", aliases: ["a1"] },
      { slug: "a3", display: "A3", aliases: ["a3"], trims: ["s3", "rs3"] },
      { slug: "a4", display: "A4", aliases: ["a4"], trims: ["s4", "rs4", "a4 avant"] },
      { slug: "a5", display: "A5", aliases: ["a5"], trims: ["s5", "rs5"] },
      { slug: "a6", display: "A6", aliases: ["a6"], trims: ["s6", "rs6", "a6 avant"] },
      { slug: "a7", display: "A7", aliases: ["a7"], trims: ["s7", "rs7"] },
      { slug: "a8", display: "A8", aliases: ["a8"], trims: ["s8"] },
      { slug: "q2", display: "Q2", aliases: ["q2"] },
      { slug: "q3", display: "Q3", aliases: ["q3"] },
      { slug: "q4-e-tron", display: "Q4 e-tron", aliases: ["q4", "q4 e-tron", "q4 etron"] },
      { slug: "q5", display: "Q5", aliases: ["q5", "sq5"] },
      { slug: "q7", display: "Q7", aliases: ["q7"] },
      { slug: "q8", display: "Q8", aliases: ["q8", "rs q8"] },
      { slug: "e-tron", display: "e-tron", aliases: ["e-tron", "etron"] },
      { slug: "tt", display: "TT", aliases: ["tt", "tts", "tt rs"] },
      { slug: "r8", display: "R8", aliases: ["r8"] },
    ],
  },
  {
    slug: "volkswagen",
    display: "Volkswagen",
    aliases: ["volkswagen", "vw", "volkswagon"],
    families: [
      { slug: "golf", display: "Golf", aliases: ["golf"], trims: ["gti", "gtd", "golf r", "r-line"] },
      { slug: "polo", display: "Polo", aliases: ["polo"], trims: ["gti"] },
      { slug: "passat", display: "Passat", aliases: ["passat"], trims: ["gte", "r-line"] },
      { slug: "tiguan", display: "Tiguan", aliases: ["tiguan"] },
      { slug: "touareg", display: "Touareg", aliases: ["touareg"] },
      { slug: "t-roc", display: "T-Roc", aliases: ["t-roc", "troc", "t roc"] },
      { slug: "t-cross", display: "T-Cross", aliases: ["t-cross", "tcross", "t cross"] },
      { slug: "arteon", display: "Arteon", aliases: ["arteon"] },
      { slug: "up", display: "up!", aliases: ["up", "up!"] },
      { slug: "id3", display: "ID.3", aliases: ["id3", "id.3", "id 3"] },
      { slug: "id4", display: "ID.4", aliases: ["id4", "id.4", "id 4"] },
      { slug: "id5", display: "ID.5", aliases: ["id5", "id.5", "id 5"] },
      { slug: "id7", display: "ID.7", aliases: ["id7", "id.7", "id 7"] },
    ],
  },
  {
    slug: "toyota",
    display: "Toyota",
    aliases: ["toyota", "toyta"],
    families: [
      { slug: "aygo-x", display: "Aygo X", aliases: ["aygo x", "aygo-x"] },
      { slug: "aygo", display: "Aygo", aliases: ["aygo"] },
      { slug: "yaris-cross", display: "Yaris Cross", aliases: ["yaris cross", "yaris-cross"] },
      { slug: "yaris", display: "Yaris", aliases: ["yaris"] },
      { slug: "corolla", display: "Corolla", aliases: ["corolla", "auris"] },
      { slug: "c-hr", display: "C-HR", aliases: ["c-hr", "chr", "c hr"] },
      { slug: "rav-4", display: "RAV4", aliases: ["rav4", "rav-4", "rav 4"] },
      { slug: "camry", display: "Camry", aliases: ["camry"] },
      { slug: "prius", display: "Prius", aliases: ["prius"] },
      { slug: "bz4x", display: "bZ4X", aliases: ["bz4x", "bz 4x"] },
      { slug: "hilux", display: "Hilux", aliases: ["hilux"] },
    ],
  },
  {
    slug: "skoda",
    display: "Škoda",
    aliases: ["skoda", "škoda", "skota"],
    families: [
      { slug: "fabia", display: "Fabia", aliases: ["fabia"] },
      { slug: "octavia", display: "Octavia", aliases: ["octavia"], trims: ["vrs", "rs"] },
      { slug: "superb", display: "Superb", aliases: ["superb"] },
      { slug: "scala", display: "Scala", aliases: ["scala"] },
      { slug: "kamiq", display: "Kamiq", aliases: ["kamiq"] },
      { slug: "karoq", display: "Karoq", aliases: ["karoq"] },
      { slug: "kodiaq", display: "Kodiaq", aliases: ["kodiaq"] },
      { slug: "enyaq", display: "Enyaq", aliases: ["enyaq"] },
    ],
  },
  {
    slug: "ford",
    display: "Ford",
    aliases: ["ford"],
    families: [
      { slug: "fiesta", display: "Fiesta", aliases: ["fiesta"], trims: ["st"] },
      { slug: "focus", display: "Focus", aliases: ["focus"], trims: ["st", "rs"] },
      { slug: "puma", display: "Puma", aliases: ["puma"], trims: ["st"] },
      { slug: "kuga", display: "Kuga", aliases: ["kuga"] },
      { slug: "mustang-mach-e", display: "Mustang Mach-E", aliases: ["mustang mach-e", "mach-e", "mache", "mustang mache"] },
      { slug: "mustang", display: "Mustang", aliases: ["mustang"] },
      { slug: "explorer", display: "Explorer", aliases: ["explorer"] },
      { slug: "ranger", display: "Ranger", aliases: ["ranger"] },
    ],
  },
  // Lighter coverage carried over so existing brands don't regress.
  {
    slug: "volvo", display: "Volvo", aliases: ["volvo"],
    families: [
      { slug: "xc40", display: "XC40", aliases: ["xc40"] }, { slug: "xc60", display: "XC60", aliases: ["xc60"] },
      { slug: "xc90", display: "XC90", aliases: ["xc90"] }, { slug: "v60", display: "V60", aliases: ["v60"] },
      { slug: "v90", display: "V90", aliases: ["v90"] }, { slug: "s60", display: "S60", aliases: ["s60"] },
      { slug: "s90", display: "S90", aliases: ["s90"] }, { slug: "ex30", display: "EX30", aliases: ["ex30"] },
      { slug: "c40", display: "C40", aliases: ["c40"] },
    ],
  },
  {
    slug: "tesla", display: "Tesla", aliases: ["tesla"],
    families: [
      { slug: "model-3", display: "Model 3", aliases: ["model 3", "model-3", "model3"] },
      { slug: "model-y", display: "Model Y", aliases: ["model y", "model-y", "modely"] },
      { slug: "model-s", display: "Model S", aliases: ["model s", "model-s", "models"] },
      { slug: "model-x", display: "Model X", aliases: ["model x", "model-x", "modelx"] },
    ],
  },
  {
    slug: "hyundai", display: "Hyundai", aliases: ["hyundai", "hyundi"],
    families: [
      { slug: "i10", display: "i10", aliases: ["i10"] }, { slug: "i20", display: "i20", aliases: ["i20"] },
      { slug: "i30", display: "i30", aliases: ["i30"] }, { slug: "tucson", display: "Tucson", aliases: ["tucson"] },
      { slug: "kona", display: "Kona", aliases: ["kona"] }, { slug: "ioniq-5", display: "Ioniq 5", aliases: ["ioniq 5", "ioniq-5"] },
      { slug: "ioniq", display: "Ioniq", aliases: ["ioniq"] }, { slug: "santa-fe", display: "Santa Fe", aliases: ["santa fe", "santa-fe"] },
    ],
  },
  {
    slug: "kia", display: "Kia", aliases: ["kia"],
    families: [
      { slug: "picanto", display: "Picanto", aliases: ["picanto"] }, { slug: "rio", display: "Rio", aliases: ["rio"] },
      { slug: "ceed", display: "Ceed", aliases: ["ceed", "cee'd"] }, { slug: "sportage", display: "Sportage", aliases: ["sportage"] },
      { slug: "niro", display: "Niro", aliases: ["niro"] }, { slug: "ev6", display: "EV6", aliases: ["ev6"] },
      { slug: "sorento", display: "Sorento", aliases: ["sorento"] },
    ],
  },
  {
    slug: "peugeot", display: "Peugeot", aliases: ["peugeot", "peugot"],
    families: [
      { slug: "208", display: "208", aliases: ["208"] }, { slug: "2008", display: "2008", aliases: ["2008"] },
      { slug: "308", display: "308", aliases: ["308"] }, { slug: "3008", display: "3008", aliases: ["3008"] },
      { slug: "5008", display: "5008", aliases: ["5008"] }, { slug: "508", display: "508", aliases: ["508"] },
    ],
  },
  {
    slug: "renault", display: "Renault", aliases: ["renault", "renaut"],
    families: [
      { slug: "clio", display: "Clio", aliases: ["clio"] }, { slug: "megane", display: "Megane", aliases: ["megane", "mégane"] },
      { slug: "captur", display: "Captur", aliases: ["captur"] }, { slug: "scenic", display: "Scenic", aliases: ["scenic", "scénic"] },
      { slug: "arkana", display: "Arkana", aliases: ["arkana"] }, { slug: "austral", display: "Austral", aliases: ["austral"] },
    ],
  },
];

// Indexes for O(1) make lookup + flattened alias→make resolution.
export const MAKE_BY_SLUG: Record<string, MakeTaxonomy> = Object.fromEntries(
  TAXONOMY.map((m) => [m.slug, m]),
);

export const MAKE_ALIAS_INDEX: Record<string, string> = (() => {
  const idx: Record<string, string> = {};
  for (const m of TAXONOMY) for (const a of m.aliases) idx[a] = m.slug;
  return idx;
})();
