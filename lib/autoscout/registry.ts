// ── AutoScout24 registry + tunables ────────────────────────────────────────
// Single source of truth for everything provider-specific. If AutoScout changes
// a param name, a country code, or a model slug, fix it HERE only.
//
// Design principle: deterministic, curated maps — never guess slugs at runtime.
// A make-only path (/lst/{makeSlug}) reliably resolves for every listed brand,
// so when a model slug is unknown we degrade to make-only instead of 404-ing.

import type { CountryCode, FuelType, TransmissionType } from "./types";

// Domain choice (verified 2026-06): autoscout24.COM is effectively deprecated as
// a marketplace — it has almost no inventory (e.g. Audi A4 → "4 offers") and
// 404s most model paths (/lst/bmw/1er 308-redirects to /lst/bmw/1-series → 404).
// autoscout24.DE serves the full pan-European inventory, accepts the German
// model slugs in taxonomy.ts (1er, c-klasse, …), and honors the `cy` country
// param for cross-border search (e.g. ?cy=B = Belgium sellers). So .de is the
// reliable base for model-filtered links; country still travels via `cy`.
export const AUTOSCOUT_BASE = "https://www.autoscout24.de/lst";

// ⚙️ ADJUST IF NEEDED — AutoScout24 query-param names.
export const PARAM_NAMES = {
  country: "cy",        // single-letter-ish AutoScout country code (see COUNTRY_CY)
  maxMileage: "kmto",
  minPrice: "pricefrom",
  maxPrice: "priceto",
  yearFrom: "fregfrom", // first registration, YYYY
  yearTo: "fregto",
  fuel: "fuelc",
  transmission: "gear",
} as const;

// ⚙️ ADJUST IF NEEDED — AutoScout24 `cy` country codes. Note these are NOT ISO:
// Germany = D, Belgium = B, Netherlands = NL. AutoScout has ~zero PL inventory
// (cy=PL returns 0), so Poland is routed to otomoto.pl in the route — never shown
// German results. PL kept non-null so the country is still carried if reached.
export const COUNTRY_CY: Record<CountryCode, string | null> = {
  NL: "NL",
  BE: "B",
  DE: "D",
  PL: "PL",
};

export const COUNTRY_LABELS: Record<CountryCode, string> = {
  NL: "Netherlands",
  BE: "Belgium",
  DE: "Germany",
  PL: "Poland",
};

// ⚙️ ADJUST IF NEEDED — AutoScout24 fuel codes.
export const FUEL_CODES: Record<FuelType, string> = {
  petrol: "B",
  diesel: "D",
  electric: "E",
  hybrid: "2",        // full hybrid
  plug_in_hybrid: "3",
};

// ⚙️ ADJUST IF NEEDED — AutoScout24 transmission codes.
export const GEAR_CODES: Record<TransmissionType, string> = {
  automatic: "A",
  manual: "M",
};

// Country name/alias → internal CountryCode. Misspellings welcome.
export const COUNTRY_ALIASES: Record<string, CountryCode> = {
  nl: "NL", netherlands: "NL", holland: "NL", "the netherlands": "NL", nederland: "NL",
  be: "BE", belgium: "BE", belgie: "BE", belgië: "BE", belgique: "BE",
  de: "DE", germany: "DE", deutschland: "DE", duitsland: "DE",
  pl: "PL", poland: "PL", polska: "PL",
};

export const FUEL_ALIASES: Record<string, FuelType> = {
  petrol: "petrol", gasoline: "petrol", gas: "petrol", benzine: "petrol", benzin: "petrol",
  diesel: "diesel",
  electric: "electric", ev: "electric", bev: "electric", elektric: "electric", electrical: "electric",
  hybrid: "hybrid", "self-charging hybrid": "hybrid", hev: "hybrid",
  phev: "plug_in_hybrid", "plug-in hybrid": "plug_in_hybrid", "plug in hybrid": "plug_in_hybrid",
};

export const TRANSMISSION_ALIASES: Record<string, TransmissionType> = {
  auto: "automatic", automatic: "automatic", automaat: "automatic", dsg: "automatic", tiptronic: "automatic",
  manual: "manual", stick: "manual", "manual gearbox": "manual", schaltgetriebe: "manual",
};

// Make display name + slug. Aliases (incl. common misspellings) → canonical key.
interface MakeEntry {
  display: string;
  slug: string;
  /** alias → verified model slug for this make */
  models: Record<string, string>;
}

// Curated verified-slug registry. Extend freely; slugs use autoscout24.com paths.
export const MAKES: Record<string, MakeEntry> = {
  "mercedes-benz": {
    display: "Mercedes-Benz",
    slug: "mercedes-benz",
    models: {
      "a-class": "a-class", "a class": "a-class",
      "b-class": "b-class", "b class": "b-class",
      "c-class": "c-class", "c class": "c-class",
      "e-class": "e-class", "e class": "e-class",
      "s-class": "s-class", "s class": "s-class",
      cla: "cla", cls: "cls", cle: "cle",
      gla: "gla", glb: "glb", glc: "glc", gle: "gle", gls: "gls",
      eqa: "eqa", eqb: "eqb", eqc: "eqc", eqe: "eqe", eqs: "eqs",
      amg: "amg-gt", "amg gt": "amg-gt", g: "g-class", "g-class": "g-class",
    },
  },
  bmw: {
    display: "BMW",
    slug: "bmw",
    models: {
      "1-series": "1er", "1 series": "1er", "116": "1er", "118": "1er", "120": "1er",
      "2-series": "2er", "2 series": "2er", "220": "2er",
      "3-series": "3er", "3 series": "3er", "318": "3er", "320": "3er", "330": "3er", "335": "3er", "340": "3er",
      "4-series": "4er", "4 series": "4er", "420": "4er", "430": "4er",
      "5-series": "5er", "5 series": "5er", "520": "5er", "530": "5er", "540": "5er", "550": "5er",
      "6-series": "6er", "7-series": "7er", "7 series": "7er", "730": "7er", "740": "7er",
      "8-series": "8er",
      x1: "x1", x2: "x2", x3: "x3", x4: "x4", x5: "x5", x6: "x6", x7: "x7",
      i3: "i3", i4: "i4", i5: "i5", i7: "i7", ix: "ix", ix3: "ix3",
      m2: "m2", m3: "m3", m4: "m4", m5: "m5", z4: "z4",
    },
  },
  audi: {
    display: "Audi",
    slug: "audi",
    models: {
      a1: "a1", a3: "a3", a4: "a4", a5: "a5", a6: "a6", a7: "a7", a8: "a8",
      q2: "q2", q3: "q3", q4: "q4-e-tron", q5: "q5", q7: "q7", q8: "q8",
      "e-tron": "e-tron", etron: "e-tron",
      tt: "tt", r8: "r8", s3: "s3", s4: "s4", rs3: "rs3", rs6: "rs6",
    },
  },
  volkswagen: {
    display: "Volkswagen",
    slug: "volkswagen",
    models: {
      golf: "golf", polo: "polo", passat: "passat", tiguan: "tiguan", touareg: "touareg",
      "t-roc": "t-roc", troc: "t-roc", "t-cross": "t-cross", arteon: "arteon",
      id3: "id3", "id.3": "id3", id4: "id4", "id.4": "id4", id5: "id5", "id.5": "id5", up: "up",
    },
  },
  toyota: {
    display: "Toyota",
    slug: "toyota",
    models: {
      yaris: "yaris", corolla: "corolla", "c-hr": "c-hr", chr: "c-hr", rav4: "rav-4", "rav-4": "rav-4",
      camry: "camry", aygo: "aygo", "aygo-x": "aygo-x", prius: "prius", "bz4x": "bz4x",
    },
  },
  volvo: {
    display: "Volvo",
    slug: "volvo",
    models: {
      xc40: "xc40", xc60: "xc60", xc90: "xc90", v60: "v60", v90: "v90",
      s60: "s60", s90: "s90", ex30: "ex30", ex90: "ex90", c40: "c40",
    },
  },
  skoda: {
    display: "Škoda",
    slug: "skoda",
    models: {
      octavia: "octavia", fabia: "fabia", superb: "superb", kodiaq: "kodiaq",
      karoq: "karoq", kamiq: "kamiq", scala: "scala", enyaq: "enyaq",
    },
  },
  peugeot: {
    display: "Peugeot",
    slug: "peugeot",
    models: { "208": "208", "308": "308", "2008": "2008", "3008": "3008", "5008": "5008", "508": "508" },
  },
  renault: {
    display: "Renault",
    slug: "renault",
    models: { clio: "clio", megane: "megane", captur: "captur", scenic: "scenic", arkana: "arkana", austral: "austral" },
  },
  ford: {
    display: "Ford",
    slug: "ford",
    models: { focus: "focus", fiesta: "fiesta", puma: "puma", kuga: "kuga", mustang: "mustang", "mustang-mach-e": "mustang-mach-e", explorer: "explorer" },
  },
  tesla: {
    display: "Tesla",
    slug: "tesla",
    models: { "model-3": "model-3", "model 3": "model-3", "model-y": "model-y", "model y": "model-y", "model-s": "model-s", "model s": "model-s", "model-x": "model-x", "model x": "model-x" },
  },
  hyundai: {
    display: "Hyundai",
    slug: "hyundai",
    models: { i10: "i10", i20: "i20", i30: "i30", tucson: "tucson", kona: "kona", ioniq: "ioniq", "ioniq-5": "ioniq-5", "ioniq 5": "ioniq-5", santa: "santa-fe", "santa-fe": "santa-fe" },
  },
  kia: {
    display: "Kia",
    slug: "kia",
    models: { picanto: "picanto", rio: "rio", ceed: "ceed", sportage: "sportage", niro: "niro", ev6: "ev6", sorento: "sorento", stonic: "stonic" },
  },
};

// make alias (incl. misspellings) → canonical MAKES key
export const MAKE_ALIASES: Record<string, string> = {
  mercedez: "mercedes-benz", mercedes: "mercedes-benz", "mercedes-benz": "mercedes-benz",
  "mercedes benz": "mercedes-benz", merc: "mercedes-benz", benz: "mercedes-benz", mb: "mercedes-benz",
  bmw: "bmw", beemer: "bmw", bimmer: "bmw",
  audi: "audi",
  vw: "volkswagen", volkswagen: "volkswagen", volkswagon: "volkswagen",
  toyota: "toyota", toyta: "toyota",
  volvo: "volvo",
  skoda: "skoda", škoda: "skoda",
  peugeot: "peugeot", peugot: "peugeot",
  renault: "renault", renaut: "renault",
  ford: "ford",
  tesla: "tesla",
  hyundai: "hyundai", hyundi: "hyundai",
  kia: "kia",
};
