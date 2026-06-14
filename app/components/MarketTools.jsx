"use client";

import React from "react";

// Hero feature strip — three quick-access cards. Cost Calculator scrolls to the
// inline calculator section; VIN Checker is not live yet (shown as "Coming
// soon", non-interactive); Live Markets scrolls to the markets grid.

export default function MarketTools() {
  const scrollTo = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="fmc-tools-wrap">
      <style>{`
        .fmc-tools-wrap{max-width:1280px;margin:0 auto;padding:0 24px}
        .fmc-feature-strip{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;max-width:1280px;margin:0 auto;width:100%;box-sizing:border-box}
        @media (max-width:760px){.fmc-feature-strip{grid-template-columns:1fr}}
        .fmc-feat-card{background:rgba(20,18,16,0.9);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:16px 18px;display:flex;align-items:center;gap:13px;cursor:pointer;transition:border-color .25s ease,transform .25s ease,background .25s ease,box-shadow .25s ease;position:relative;overflow:hidden;text-align:left;font-family:inherit;width:100%}
        .fmc-feat-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(251,191,36,0.2),transparent)}
        .fmc-feat-card:hover{border-color:rgba(251,191,36,0.35);background:rgba(251,191,36,0.06);transform:translateY(-2px);box-shadow:0 14px 34px rgba(0,0,0,.4),0 0 18px rgba(251,191,36,.08)}
        .fmc-feat-ico{width:38px;height:38px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.18);border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fbbf24;flex-shrink:0}
        .fmc-feat-text{flex:1;min-width:0}
        .fmc-feat-title{font-size:13.5px;font-weight:600;color:#f5f1ea}
        .fmc-feat-sub{font-size:11px;color:#8a8178;margin-top:2px}
        .fmc-feat-arrow{color:#5e574f;flex-shrink:0;transition:color .25s ease,transform .25s ease}
        .fmc-feat-card:hover .fmc-feat-arrow{color:#fbbf24;transform:translateX(3px)}

        /* Coming-soon (unavailable) card */
        .fmc-feat-card.soon{cursor:default}
        .fmc-feat-card.soon:hover{border-color:rgba(255,255,255,0.08);background:rgba(20,18,16,0.9);transform:none;box-shadow:none}
        .fmc-feat-card.soon .fmc-feat-ico{opacity:.5}
        .fmc-feat-card.soon .fmc-feat-title{color:#8a8178}
        .fmc-soon-badge{flex-shrink:0;font-size:9.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#fbbf24;background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.3);border-radius:999px;padding:4px 9px;white-space:nowrap}
      `}</style>

      <div className="fmc-feature-strip">
        <button className="fmc-feat-card" type="button" onClick={() => scrollTo("home-calculator")}>
          <span className="fmc-feat-ico">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M8 6h8M8 10h8M8 14h3M15 14h1M8 18h3M15 18h1" /></svg>
          </span>
          <span className="fmc-feat-text">
            <span className="fmc-feat-title">Cost Calculator</span>
            <span className="fmc-feat-sub">Fuel · tax · total ownership</span>
          </span>
          <svg className="fmc-feat-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </button>

        <div className="fmc-feat-card soon" aria-disabled="true">
          <span className="fmc-feat-ico">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-5" /><path d="M12 3l7 4v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V7l7-4z" /></svg>
          </span>
          <span className="fmc-feat-text">
            <span className="fmc-feat-title">VIN Checker</span>
            <span className="fmc-feat-sub">History · mileage · stolen check</span>
          </span>
          <span className="fmc-soon-badge">Coming soon</span>
        </div>

        <button className="fmc-feat-card" type="button" onClick={() => scrollTo("home-markets")}>
          <span className="fmc-feat-ico">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
          </span>
          <span className="fmc-feat-text">
            <span className="fmc-feat-title">Live Markets</span>
            <span className="fmc-feat-sub">NL · BE · DE · PL listings</span>
          </span>
          <svg className="fmc-feat-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </button>
      </div>
    </div>
  );
}
