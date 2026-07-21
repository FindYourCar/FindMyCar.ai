"use client";

import React from "react";
import { getCarImage, FALLBACK_SVG } from "@/lib/carImages";

// ── Reusable car photo ─────────────────────────────────────────────────────
// Single component for every offer/listing car image. It renders a plain <img>
// tagged with the CarImages API data attributes (data-ci-make/model/year); the
// loader script in app/layout.tsx resolves the studio render and swaps the src
// in-place from the edge CDN.
//
// Fallback order (so a card is never broken):
//   1. CarImages API studio render  (loader overwrites src)
//   2. curated local catalog image  (lib/carImages, the initial src)
//   3. neutral placeholder SVG       (on load error)
//
// React/loader coordination: the loader mutates the DOM src directly, outside
// React. We therefore keep the `src` prop VALUE stable across re-renders of the
// same car (React only writes the DOM when the value changes, so it won't clobber
// the loader's render), and give the <img> a `key` tied to make/model/year so a
// different car remounts cleanly and the loader re-resolves.

export interface CarImageProps {
  make?: string | null;
  model?: string | null;
  year?: number | null;
  /** Free-text like "Volkswagen Golf" when make/model aren't split out. */
  title?: string | null;
  /** Overrides the curated local fallback (e.g. a server-resolved image). */
  fallbackSrc?: string;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
}

export default function CarImage({
  make,
  model,
  year,
  title,
  fallbackSrc,
  alt,
  className,
  width,
  height,
}: CarImageProps) {
  const identity = `${make ?? ""}|${model ?? ""}|${year ?? ""}|${title ?? ""}`;

  // Curated local result: real car if we have one, else the placeholder. Used
  // as the initial src (and the alt) before/if the API render doesn't apply.
  const local = getCarImage({ make, model, title });
  const initialSrc = fallbackSrc || local.src;

  // Track a hard failure per-car so a new car (new key) starts clean.
  const [erroredIdentity, setErroredIdentity] = React.useState<string | null>(null);
  const failed = erroredIdentity === identity;

  return (
    <img
      key={identity}
      // CarImages API hints — the loader resolves the studio render from these.
      // Emitted unconditionally (inert without a loader); NOT gated on a
      // build-time env var, which is what silently disabled them on Vercel.
      data-ci-make={make || undefined}
      data-ci-model={model || undefined}
      data-ci-year={year ? String(year) : undefined}
      src={failed ? FALLBACK_SVG : initialSrc}
      alt={alt || local.alt}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      className={className}
      onError={() => setErroredIdentity(identity)}
    />
  );
}
