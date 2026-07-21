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
        // TEMP DEBUG (remove after prod confirmation)
        console.log("[CarImages] loader: key present =", Boolean(key));
        if (cancelled || !key || document.getElementById(LOADER_ID)) return;

        const s = document.createElement("script");
        s.id = LOADER_ID;
        s.src = LOADER_SRC;
        s.async = true;
        s.setAttribute("data-api-key", key);
        // TEMP DEBUG (remove after prod confirmation)
        s.onload = () => console.log("[CarImages] loader script loaded");
        s.onerror = () => console.warn("[CarImages] loader script FAILED to load");
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
