"use client";

import React from "react";
import Car3DPanel from "./Car3DPanel";

// ── "View 3D" pill ──────────────────────────────────────────────────────────
// Drop-in trigger that owns the open/close state and renders the 3D overlay.
// Any recommendation card can add it in one line; position it with `className`
// (e.g. absolutely over the image). Renders nothing if there's no car to show.

export interface Car3DButtonProps {
  make?: string | null;
  model?: string | null;
  year?: number | null;
  title?: string | null;
  /** Positioning/layout classes from the host (the pill styling is built in). */
  className?: string;
}

export default function Car3DButton({ make, model, year, title, className }: Car3DButtonProps) {
  const [open, setOpen] = React.useState(false);

  if (!make && !(title && title.trim())) return null;

  return (
    <>
      <button
        type="button"
        className={`c3db ${className ?? ""}`}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label="View this car in interactive 3D"
      >
        <style>{`
          .c3db{display:inline-flex;align-items:center;gap:6px;border-radius:999px;cursor:pointer;
            padding:5px 11px 5px 9px;font-size:11px;font-weight:600;font-family:inherit;color:#f8ecd0;
            background:rgba(18,15,11,.62);border:1px solid rgba(251,191,36,.4);
            backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
            box-shadow:0 4px 16px rgba(0,0,0,.35);transition:transform .2s,background .2s,box-shadow .2s,border-color .2s}
          .c3db:hover{transform:translateY(-1px);background:rgba(30,22,12,.8);border-color:rgba(251,191,36,.7);box-shadow:0 8px 22px rgba(217,119,6,.32)}
          .c3db:focus-visible{outline:2px solid #fbbf24;outline-offset:2px}
          .c3db svg{color:#fbbf24}
          @media (prefers-reduced-motion:reduce){.c3db{transition:none}}
        `}</style>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
        </svg>
        View 3D
      </button>

      <Car3DPanel
        open={open}
        onClose={() => setOpen(false)}
        make={make}
        model={model}
        year={year}
        title={title}
      />
    </>
  );
}
