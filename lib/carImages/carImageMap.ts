// ── Curated car image catalog ──────────────────────────────────────────────
// Local, watermark-free imagery only. Every path here points at a file we host
// ourselves under /public/cars/, sourced from Unsplash or Pexels (both free for
// commercial use, no attribution required).
//
// Why local-only: the previous setup pulled remote stock URLs we could not
// verify, and got it wrong — the "Volkswagen Golf" entry was actually a photo of
// a Ford Mustang. A curated catalog makes the picture auditable: if it's listed
// here, someone looked at it.
//
// Matching is by MAKE + MODEL, never trim. "Golf", "Golf 8" and "Golf VIII" all
// resolve to the same clean Golf photo — a good generic shot beats a confidently
// wrong trim-specific one.

export interface CarImageEntry {
  make: string;
  model: string;
  /** Extra spellings/generations that should resolve to the same image. */
  aliases?: string[];
  /** Path under /public. */
  image: string;
  source?: "Unsplash" | "Pexels";
}

/** Generic fallback when we have no image for the make at all. */
export const FALLBACK_IMAGE = "/cars/fallback/car-placeholder.jpg";

/**
 * Last-resort fallback. This one is a committed SVG we generate ourselves, so it
 * is guaranteed to exist even before any photography is added. The <img> onError
 * handler lands here, which is why a missing .jpg can never show a broken icon.
 */
export const FALLBACK_SVG = "/cars/fallback/car-placeholder.svg";

/**
 * Model-level catalog.
 * TODO: add the matching .jpg files under /public/cars/<make>/<model>.jpg —
 * see public/cars/README.md for the exact filenames still outstanding.
 */
export const carImageMap: CarImageEntry[] = [
  {
    make: "Volkswagen",
    model: "Golf",
    aliases: ["Golf 8", "Golf VIII", "Golf 7", "Golf VII", "Golf GTI", "Golf Variant"],
    image: "/cars/volkswagen/golf.jpg",
    source: "Unsplash",
  },
  {
    make: "Skoda",
    model: "Octavia",
    aliases: ["Octavia Combi", "Octavia RS"],
    image: "/cars/skoda/octavia.jpg",
    source: "Unsplash",
  },
  {
    make: "Audi",
    model: "A3",
    aliases: ["A3 Sportback", "A3 Limousine"],
    image: "/cars/audi/a3.jpg",
    source: "Unsplash",
  },
  {
    make: "BMW",
    model: "3-Series",
    aliases: ["3 Series", "3er", "Seria 3", "330i", "320d"],
    image: "/cars/bmw/3-series.jpg",
    source: "Unsplash",
  },
  {
    make: "Mercedes-Benz",
    model: "A-Class",
    aliases: ["A Class", "A-Klasse", "A-Klasa", "A180", "A200"],
    image: "/cars/mercedes-benz/a-class.jpg",
    source: "Unsplash",
  },
  {
    make: "SEAT",
    model: "Leon",
    aliases: ["Leon FR", "Leon ST"],
    image: "/cars/seat/leon.jpg",
    source: "Pexels",
  },
  {
    make: "Renault",
    model: "Clio",
    aliases: ["Clio V", "Clio 5"],
    image: "/cars/renault/clio.jpg",
    source: "Unsplash",
  },
  {
    make: "Peugeot",
    model: "208",
    aliases: ["e-208", "208 GT"],
    image: "/cars/peugeot/208.jpg",
    source: "Unsplash",
  },
  // TODO: extend with more approved models (Toyota Corolla, Ford Focus,
  // Opel Astra, Volvo V40…) — add the entry AND the image file together.
];

/**
 * Make-level fallbacks, used when we know the brand but not that specific model.
 * A clean brand-appropriate car beats the generic placeholder.
 *
 * TODO: add /public/cars/<make>/_make.jpg for each brand you want covered.
 */
export const makeImageMap: Record<string, string> = {
  volkswagen: "/cars/volkswagen/_make.jpg",
  skoda: "/cars/skoda/_make.jpg",
  audi: "/cars/audi/_make.jpg",
  bmw: "/cars/bmw/_make.jpg",
  "mercedes-benz": "/cars/mercedes-benz/_make.jpg",
  seat: "/cars/seat/_make.jpg",
  renault: "/cars/renault/_make.jpg",
  peugeot: "/cars/peugeot/_make.jpg",
};

/**
 * Brand spellings → canonical make. Keeps "VW"/"Mercedes"/"VAG-speak" working
 * without leaking alias logic into the UI.
 */
export const makeAliases: Record<string, string> = {
  vw: "volkswagen",
  volkswagon: "volkswagen",
  mercedes: "mercedes-benz",
  "mercedes benz": "mercedes-benz",
  benz: "mercedes-benz",
  mb: "mercedes-benz",
  skoda: "skoda",
  "škoda": "skoda",
  bmw: "bmw",
  audi: "audi",
  seat: "seat",
  cupra: "seat",
  renault: "renault",
  peugeot: "peugeot",
};
