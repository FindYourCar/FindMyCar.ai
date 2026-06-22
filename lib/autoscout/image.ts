// Vehicle imagery with a deterministic, WATERMARK-FREE fallback chain.
//
// Image policy (strict):
//   1. clean representative make image (no watermark)
//   2. premium neutral car fallback (no watermark)
//   3. inline SVG last resort
// We deliberately do NOT use the imagin.studio demo bucket: its free "img"
// customer stamps a visible watermark, and a watermarked "exact" render must
// never be preferred over a clean representative image. A licensed CDN key can
// be reintroduced later as priority 1 ONLY if it returns watermark-free output.

import type { CarSearchIntent } from "./types";

// Curated, always-available stills keyed by "makeSlug" or "makeSlug:modelSlug".
// Extend with licensed/own-hosted images for the models you care most about.
const CURATED: Record<string, string> = {
  "mercedes-benz": "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80",
  bmw: "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
  audi: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80",
  volkswagen: "https://images.unsplash.com/photo-1622551515480-2c1f3a3a6f5e?auto=format&fit=crop&w=1200&q=80",
  tesla: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1200&q=80",
  toyota: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=1200&q=80",
  volvo: "https://images.unsplash.com/photo-1617469767053-d3b523a0b982?auto=format&fit=crop&w=1200&q=80",
};

// Final, guaranteed fallback (premium dark car) + an inline SVG last resort.
const GENERIC = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80";

export const PLACEHOLDER_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='675'>
       <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
         <stop offset='0' stop-color='#161310'/><stop offset='1' stop-color='#0c0a08'/>
       </linearGradient></defs>
       <rect width='1200' height='675' fill='url(#g)'/>
       <g fill='none' stroke='#fbbf24' stroke-opacity='0.5' stroke-width='8' stroke-linecap='round'>
         <path d='M470 360c0-30 28-90 90-90h120c30 0 70 38 92 60 36 8 58 22 58 50 0 18-12 34-30 34'/>
         <circle cx='540' cy='410' r='26'/><circle cx='720' cy='410' r='26'/>
       </g>
       <text x='600' y='520' fill='#8a8178' font-family='sans-serif' font-size='30' text-anchor='middle'>Image unavailable</text>
     </svg>`
  );

export interface CarImage {
  primary: string;
  fallbacks: string[];
  alt: string;
}

export function resolveCarImage(intent: CarSearchIntent): CarImage {
  const candidates: string[] = [];

  // 1. clean per-model still if we curated one (no watermark)
  if (intent.makeSlug && intent.modelSlug) {
    const curatedModel = CURATED[`${intent.makeSlug}:${intent.modelSlug}`];
    if (curatedModel) candidates.push(curatedModel);
  }
  // 2. clean representative make still (no watermark)
  if (intent.makeSlug && CURATED[intent.makeSlug]) candidates.push(CURATED[intent.makeSlug]);
  // 3. premium neutral fallback + inline SVG
  candidates.push(GENERIC);
  candidates.push(PLACEHOLDER_SVG);

  const alt = [intent.make, intent.model].filter(Boolean).join(" ") || "Car";
  const [primary, ...fallbacks] = Array.from(new Set(candidates));
  return { primary, fallbacks, alt: `${alt} — representative image` };
}
