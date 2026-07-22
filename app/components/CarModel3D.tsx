"use client";

import React from "react";

// ── Interactive 3D car model ────────────────────────────────────────────────
// Renders a <model-viewer> tagged with the SAME CarImages attributes as the
// photo (data-ci-make / data-ci-model / data-ci-year). The global CarImages
// loader (see CarImagesLoader) resolves the studio GLB and sets the element's
// `src`, exactly as it does for <img> in image mode.
//
// The element is created imperatively so we (a) avoid JSX typings for a custom
// element and (b) can set model-viewer's presence attributes (camera-controls,
// auto-rotate) precisely. @google/model-viewer is imported lazily on mount —
// it touches `window`, so it must never run on the server.
//
// States: loading → ready (model loaded) | unavailable (no 3D for this car).
// Reusable anywhere; not coupled to LiveMarketCard.

export interface CarModel3DProps {
  make?: string | null;
  model?: string | null;
  year?: number | null;
  className?: string;
}

type State = "loading" | "ready" | "unavailable";

export default function CarModel3D({ make, model, year, className }: CarModel3DProps) {
  const hostRef = React.useRef<HTMLDivElement>(null);
  const identity = `${make ?? ""}|${model ?? ""}|${year ?? ""}`;
  // State starts fresh per car: callers give this component a `key` tied to the
  // car (Car3DPanel does), so a different car remounts and resets cleanly.
  const [state, setState] = React.useState<State>(make ? "loading" : "unavailable");
  const [pct, setPct] = React.useState(0);

  React.useEffect(() => {
    if (!make) return; // nothing to resolve; state is already "unavailable"

    let cancelled = false;
    let mv: HTMLElement | null = null;
    const timers: number[] = [];

    const onProgress = (e: Event) => {
      const detail = (e as CustomEvent).detail as { totalProgress?: number } | undefined;
      setPct(Math.round((detail?.totalProgress ?? 0) * 100));
    };
    const onLoad = () => { if (!cancelled) setState("ready"); };
    const onError = () => { if (!cancelled) setState("unavailable"); };

    (async () => {
      try {
        await import("@google/model-viewer"); // registers the custom element
      } catch {
        if (!cancelled) setState("unavailable");
        return;
      }
      if (cancelled || !hostRef.current) return;

      mv = document.createElement("model-viewer");
      // CarImages hints — resolved by the global loader, same as the <img>.
      mv.setAttribute("data-ci-make", make);
      if (model) mv.setAttribute("data-ci-model", model);
      if (year) mv.setAttribute("data-ci-year", String(year));
      // Load immediately: the panel animates in from off-screen, so the default
      // viewport-based lazy loading ("auto") would never trigger.
      mv.setAttribute("loading", "eager");
      mv.setAttribute("reveal", "auto");
      // Interaction.
      mv.setAttribute("camera-controls", "");
      mv.setAttribute("auto-rotate", "");
      mv.setAttribute("auto-rotate-delay", "0");
      mv.setAttribute("rotation-per-second", "16deg"); // slower, more elegant
      mv.setAttribute("interaction-prompt", "none");
      mv.setAttribute("touch-action", "pan-y");
      // Heroic opening framing: a 3/4 front angle, slightly above the car, and
      // pulled in to ~90% of the auto-fit so the model dominates the stage.
      mv.setAttribute("camera-orbit", "-26deg 75deg 90%");
      mv.setAttribute("field-of-view", "32deg");
      mv.setAttribute("min-field-of-view", "22deg");
      mv.setAttribute("max-field-of-view", "45deg");
      // Dark cinematic studio: dimmer exposure for a richer, moodier read, with a
      // strong, soft contact shadow for depth. tone-mapping="commerce" keeps the
      // paintwork punchy against the dark background.
      mv.setAttribute("environment-image", "neutral");
      mv.setAttribute("exposure", "0.92");
      mv.setAttribute("shadow-intensity", "1.8");
      mv.setAttribute("shadow-softness", "0.9");
      mv.setAttribute("tone-mapping", "commerce");
      mv.className = "c3d-viewer";
      mv.addEventListener("progress", onProgress);
      mv.addEventListener("load", onLoad);
      mv.addEventListener("error", onError);
      hostRef.current.appendChild(mv);

      // If the loader hasn't set a src within a few seconds, this car has no 3D
      // model — show the fallback rather than spinning forever.
      timers.push(window.setTimeout(() => {
        if (cancelled || !mv) return;
        if (!mv.getAttribute("src")) setState((s) => (s === "ready" ? s : "unavailable"));
      }, 9000));
      // Absolute cap in case a src was set but never finishes.
      timers.push(window.setTimeout(() => {
        if (!cancelled) setState((s) => (s === "ready" ? s : "unavailable"));
      }, 16000));
    })();

    return () => {
      cancelled = true;
      timers.forEach((t) => clearTimeout(t));
      if (mv) {
        mv.removeEventListener("progress", onProgress);
        mv.removeEventListener("load", onLoad);
        mv.removeEventListener("error", onError);
        mv.remove();
      }
    };
  }, [identity, make, model, year]);

  return (
    <div className={`c3d ${className ?? ""}`}>
      <style>{`
        .c3d{position:relative;width:100%;height:100%;min-height:360px}
        .c3d-stage{position:absolute;inset:0}
        .c3d-stage model-viewer{width:100%;height:100%;background:transparent;--poster-color:transparent;outline:none;
          opacity:0;transform:scale(.96);transform-origin:50% 60%;transition:opacity .85s ease,transform 1.05s cubic-bezier(.22,1,.36,1)}
        .c3d-stage[data-state="ready"] model-viewer{opacity:1;transform:scale(1)}
        .c3d-stage model-viewer::part(default-progress-bar){display:none}
        .c3d-stage model-viewer::part(default-ar-button){display:none}
        .c3d-overlay{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:13px;text-align:center;padding:26px;pointer-events:none}
        .c3d-spin{width:40px;height:40px;border-radius:50%;border:2.5px solid rgba(251,191,36,.16);border-top-color:#fbbf24;animation:c3dspin .8s linear infinite}
        @keyframes c3dspin{to{transform:rotate(360deg)}}
        .c3d-loadtxt{font-size:12.5px;color:rgba(255,255,255,.7);letter-spacing:.02em}
        .c3d-bar{width:158px;height:3px;border-radius:999px;background:rgba(255,255,255,.1);overflow:hidden}
        .c3d-bar span{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#fbbf24,#d97706);transition:width .3s ease}
        .c3d-ficon{width:46px;height:46px;color:rgba(251,191,36,.75)}
        .c3d-ftitle{font-size:14px;font-weight:600;color:#f5f1ea}
        .c3d-fsub{font-size:12px;line-height:1.55;color:rgba(255,255,255,.55);max-width:260px}
        @media (prefers-reduced-motion:reduce){.c3d-spin{animation:none}.c3d-stage model-viewer{transition:none;transform:none}}
      `}</style>

      <div ref={hostRef} className="c3d-stage" data-state={state} />

      {state === "loading" && (
        <div className="c3d-overlay">
          <div className="c3d-spin" />
          <div className="c3d-loadtxt">Rendering interactive 3D preview…</div>
          <div className="c3d-bar"><span style={{ width: `${Math.max(6, pct)}%` }} /></div>
        </div>
      )}

      {state === "unavailable" && (
        <div className="c3d-overlay">
          <svg className="c3d-ficon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
            <path d="M3 3l18 18" stroke="rgba(255,255,255,.35)" />
          </svg>
          <div className="c3d-ftitle">3D preview isn’t available yet</div>
          <div className="c3d-fsub">We couldn’t load an interactive model for this car. The photo is the best current match.</div>
        </div>
      )}
    </div>
  );
}
