// ── Otomoto.pl provider (Poland) ───────────────────────────────────────────
// AutoScout24 has ~zero Polish inventory (cy=PL returns 0 results), so a request
// for Poland must NOT silently fall back to a German-domain link. Poland is
// served by its real local marketplace, otomoto.pl, instead. Make slugs match
// our make slugs (bmw, audi, mercedes-benz, opel…); model slugs are Polish
// (seria-1, klasa-c) and not in our taxonomy, so we honestly stay at make level
// for the model and carry the numeric filters, which otomoto supports.

import type { CarSearchIntent } from "./types";

const OTOMOTO_BASE = "https://www.otomoto.pl/osobowe";

// otomoto fuel enum values (subset we map). Unmapped → omitted (informational).
const OTOMOTO_FUEL: Record<string, string> = {
  petrol: "petrol",
  diesel: "diesel",
  electric: "electric",
  hybrid: "hybrid",
  plug_in_hybrid: "plugin-hybrid",
};

export interface OtomotoUrl {
  url: string;
  /** true when a model was requested but we could only filter at make level */
  modelOmitted: boolean;
}

export function buildOtomotoUrl(intent: CarSearchIntent): OtomotoUrl {
  const segs: string[] = [];
  if (intent.makeSlug) segs.push(intent.makeSlug);
  const path = segs.length ? `/${segs.join("/")}` : "";

  const p = new URLSearchParams();
  if (intent.maxPrice) p.set("search[filter_float_price:to]", String(intent.maxPrice));
  if (intent.minPrice) p.set("search[filter_float_price:from]", String(intent.minPrice));
  if (intent.maxMileage) p.set("search[filter_float_mileage:to]", String(intent.maxMileage));
  if (intent.yearFrom) p.set("search[filter_float_first_registration_year:from]", String(intent.yearFrom));
  if (intent.yearTo) p.set("search[filter_float_first_registration_year:to]", String(intent.yearTo));
  if (intent.fuel && OTOMOTO_FUEL[intent.fuel]) p.set("search[filter_enum_fuel_type]", OTOMOTO_FUEL[intent.fuel]);
  if (intent.transmission) p.set("search[filter_enum_gearbox]", intent.transmission === "automatic" ? "automatic" : "manual");
  p.set("utm_source", "findmycar");

  const qs = p.toString();
  return {
    url: `${OTOMOTO_BASE}${path}${qs ? `?${qs}` : ""}`,
    modelOmitted: Boolean(intent.model && intent.makeSlug),
  };
}
