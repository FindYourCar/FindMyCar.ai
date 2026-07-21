"use client";

import React from "react";
import { createPortal } from "react-dom";
import CarModel3D from "./CarModel3D";

// ── 3D preview overlay ──────────────────────────────────────────────────────
// Desktop: a right-side slide-over. Mobile (≤640px): a bottom sheet. Same
// component, switched purely by CSS. Rendered through a portal to <body> so it
// escapes the card's overflow:hidden. Reusable by any recommendation card.
//
// A11y: role="dialog" + aria-modal, Esc to close, backdrop click to close,
// focus moves to the close button on open and returns to the trigger on close,
// body scroll locked while open.

export interface Car3DPanelProps {
  open: boolean;
  onClose: () => void;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  title?: string | null;
}

export default function Car3DPanel({ open, onClose, make, model, year, title }: Car3DPanelProps) {
  const closeRef = React.useRef<HTMLButtonElement>(null);

  // The overlay stays mounted and animates purely via the `.c3dp-open` class, so
  // there's no mount/unmount state to juggle. Only the (heavy) 3D viewer is gated
  // on `open`. Scroll-lock, Esc and focus run while open — no setState here.
  React.useEffect(() => {
    if (!open) return;
    const restoreFocus = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const f = requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      cancelAnimationFrame(f);
      restoreFocus?.focus?.();
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  const heading =
    (title && title.trim()) ||
    [make, model, year].filter(Boolean).join(" ").trim() ||
    "3D preview";

  return createPortal(
    <div
      className="c3dp"
      role="dialog"
      aria-modal="true"
      aria-label={`${heading} — interactive 3D preview`}
      inert={!open}
      style={{ pointerEvents: open ? "auto" : "none" }}
    >
      <style>{`
        /* Open/close is driven by inline styles on the elements (transform,
           opacity, pointer-events) — reliable regardless of cascade order. CSS
           holds the static look + the closed resting transform + the transition. */
        .c3dp{position:fixed;inset:0;z-index:1000}
        .c3dp-backdrop{position:fixed;inset:0;background:rgba(6,5,4,.62);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);transition:opacity .42s ease}
        .c3dp-panel{position:fixed;top:0;right:0;bottom:0;height:100dvh;width:min(468px,94vw);display:flex;flex-direction:column;
          background:linear-gradient(160deg,#151210 0%,#0b0a08 100%);border-left:1px solid rgba(251,191,36,.16);
          box-shadow:-34px 0 90px rgba(0,0,0,.55);transform:translateX(100%);transition:transform .46s cubic-bezier(.22,1,.36,1)}
        .c3dp-handle{display:none}
        .c3dp-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:20px 20px 16px;border-bottom:1px solid rgba(255,255,255,.07)}
        .c3dp-eyebrow{display:inline-flex;align-items:center;gap:7px;font-size:10.5px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#fbbf24}
        .c3dp-dot{width:6px;height:6px;border-radius:50%;background:#fbbf24;box-shadow:0 0 0 0 rgba(251,191,36,.5);animation:c3dpPulse 2s ease-out infinite}
        @keyframes c3dpPulse{0%{box-shadow:0 0 0 0 rgba(251,191,36,.5)}70%{box-shadow:0 0 0 7px rgba(251,191,36,0)}100%{box-shadow:0 0 0 0 rgba(251,191,36,0)}}
        .c3dp-title{margin-top:6px;font-size:17px;font-weight:600;color:#fff;line-height:1.25}
        .c3dp-close{flex-shrink:0;width:36px;height:36px;display:inline-flex;align-items:center;justify-content:center;border-radius:10px;
          background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.8);cursor:pointer;transition:all .2s}
        .c3dp-close:hover{background:rgba(255,255,255,.12);color:#fff;transform:translateY(-1px)}
        .c3dp-close:focus-visible{outline:2px solid #fbbf24;outline-offset:2px}
        .c3dp-stage{flex:1;position:relative;min-height:0;margin:16px;border-radius:16px;overflow:hidden;
          background:radial-gradient(120% 90% at 50% 18%,rgba(251,191,36,.07) 0%,rgba(20,18,16,0) 55%),linear-gradient(180deg,#1a1613,#0c0a08);
          border:1px solid rgba(255,255,255,.06)}
        .c3dp-foot{padding:0 20px 20px;text-align:center;font-size:11px;color:rgba(255,255,255,.42);letter-spacing:.02em}

        @media (max-width:640px){
          .c3dp-panel{top:auto;right:0;left:0;bottom:0;width:100%;height:min(88dvh,760px);
            border-left:none;border-top:1px solid rgba(251,191,36,.16);border-radius:22px 22px 0 0;
            box-shadow:0 -30px 80px rgba(0,0,0,.55);transform:translateY(100%)}
          .c3dp-handle{display:block;width:40px;height:4px;border-radius:999px;background:rgba(255,255,255,.22);margin:10px auto 2px}
        }
        @media (prefers-reduced-motion:reduce){
          .c3dp-backdrop,.c3dp-panel{transition:none}
          .c3dp-dot{animation:none}
        }
      `}</style>

      <div className="c3dp-backdrop" onClick={onClose} style={{ opacity: open ? 1 : 0 }} />

      <div className="c3dp-panel" style={{ transform: open ? "translate(0px, 0px)" : undefined }}>
        <div className="c3dp-handle" aria-hidden="true" />
        <div className="c3dp-head">
          <div>
            <span className="c3dp-eyebrow"><span className="c3dp-dot" /> Interactive 3D preview</span>
            <div className="c3dp-title">{heading}</div>
          </div>
          <button ref={closeRef} type="button" className="c3dp-close" onClick={onClose} aria-label="Close 3D preview">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="c3dp-stage">
          {/* Mount the heavy viewer only while open; key it so a different car
              remounts and resets to the loading state. */}
          {open && <CarModel3D key={`${make}|${model}|${year}`} make={make} model={model} year={year} />}
        </div>

        <div className="c3dp-foot">Drag to orbit · scroll to zoom</div>
      </div>
    </div>,
    document.body,
  );
}
