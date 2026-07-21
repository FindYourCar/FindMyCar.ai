"use client";

import React from "react";

// Injects the CarImages loader script using a key read at RUNTIME (via
// /api/carimages-key), so it works regardless of what was inlined at build time
// — the root cause of the Vercel prod failure. The loader script scans existing
// <img data-ci-*> elements on load and sets up a MutationObserver for ones added
// later, so it correctly picks up LiveMarketCards whether they render before or
// after the script loads.

const LOADER_ID = "carimages-loader";
const LOADER_SRC = "https://carimagesapi.com/assets/js/carimages.js";

export default function CarImagesLoader() {
  React.useEffect(() => {
    if (document.getElementById(LOADER_ID)) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/carimages-key", { cache: "no-store" });
        const { key } = (await res.json()) as { key?: string };
        if (cancelled || !key || document.getElementById(LOADER_ID)) return;

        const s = document.createElement("script");
        s.id = LOADER_ID;
        s.src = LOADER_SRC;
        s.async = true;
        s.setAttribute("data-api-key", key);
        s.onerror = () => console.warn("[CarImages] loader script failed to load");
        document.body.appendChild(s);
      } catch (err) {
        console.warn("[CarImages] loader: could not fetch key", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
