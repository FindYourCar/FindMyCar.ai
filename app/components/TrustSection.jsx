"use client";

import React from "react";

// "Built differently, on purpose." — why-FindMyCar stats + testimonial,
// ported from the concept artifact.
export default function TrustSection() {
  return (
    <section id="home-why" className="scroll-mt-24" style={{ padding: "96px 24px", background: "linear-gradient(180deg,transparent,rgba(18,16,14,0.4))", borderTop: "1px solid var(--border)" }}>
      <style>{`
        .twy-inner{max-width:1280px;margin:0 auto}
        .twy-head{text-align:center;max-width:540px;margin:0 auto}
        .twy-eyebrow{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--muted);display:flex;align-items:center;gap:8px;justify-content:center;margin-bottom:12px}
        .twy-dot{width:6px;height:6px;border-radius:50%;background:var(--amber);box-shadow:0 0 10px rgba(251,191,36,.7);flex-shrink:0}
        .twy-title{font-family:'Fraunces',Georgia,serif;font-size:clamp(26px,3.8vw,44px);font-weight:600;letter-spacing:-.03em;color:#f9fafb;margin:10px 0;line-height:1.1}
        .twy-title em{font-style:italic;background:linear-gradient(135deg,#fbbf24 0%,#d97706 50%,#92400e 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .twy-sub{color:var(--muted);font-size:15px;line-height:1.65;margin:10px auto 0;max-width:52ch}
        .twy-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-top:48px}
        @media(min-width:768px){.twy-grid{grid-template-columns:repeat(4,1fr)}}
        .twy-stat{padding:26px;background:linear-gradient(180deg,#161310 0%,#0f0d0b 100%);border:1px solid var(--border);border-radius:18px;position:relative;text-align:center}
        .twy-stat::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;border-radius:18px 18px 0 0;background:linear-gradient(90deg,transparent,rgba(251,191,36,.22),transparent)}
        .twy-n{font-family:'Fraunces',Georgia,serif;font-size:34px;font-weight:700;color:var(--amber);letter-spacing:-.02em;margin-bottom:5px}
        .twy-l{font-size:12px;color:var(--muted);line-height:1.45}
        .twy-quote{margin:48px auto 0;max-width:740px;padding:30px;background:linear-gradient(180deg,#161310,#0f0d0b);border:1px solid var(--border);border-radius:20px;position:relative;overflow:hidden}
        .twy-quote::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(251,191,36,.28),transparent)}
        .twy-quote p{font-family:'Fraunces',Georgia,serif;font-size:18px;line-height:1.55;color:#cdc6bc;font-style:italic;margin:16px 0}
        .twy-author{display:flex;align-items:center;gap:12px}
        .twy-av{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,rgba(251,191,36,.28),rgba(217,119,6,.12));border:1px solid rgba(251,191,36,.28);display:flex;align-items:center;justify-content:center;color:var(--amber);font-size:13px;font-weight:600;flex-shrink:0}
        .twy-nm{font-size:13.5px;font-weight:600;color:var(--text)}
        .twy-loc{font-size:12px;color:var(--muted)}
      `}</style>

      <div className="twy-inner">
        <div className="twy-head">
          <div className="twy-eyebrow"><span className="twy-dot" /> Why FindMyCar</div>
          <h2 className="twy-title">Built differently, <em>on purpose.</em></h2>
          <p className="twy-sub">No placement fees. No sponsored slots. No &ldquo;featured&rdquo; dealers. The AI ranks for fit — never for who paid the most to be seen.</p>
        </div>

        <div className="twy-grid">
          <div className="twy-stat"><div className="twy-n">€0</div><div className="twy-l">Commission charged<br />to buyers, ever</div></div>
          <div className="twy-stat"><div className="twy-n">4</div><div className="twy-l">Markets — NL,<br />BE, DE, PL</div></div>
          <div className="twy-stat"><div className="twy-n">94%</div><div className="twy-l">Average match<br />confidence score</div></div>
          <div className="twy-stat"><div className="twy-n">4</div><div className="twy-l">Languages<br />supported</div></div>
        </div>

        <div className="twy-quote">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="#fbbf24" opacity="0.35" aria-hidden="true"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" /><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" /></svg>
          <p>&ldquo;I described what I needed in three sentences. Twenty minutes later I had five real cars to look at — all within budget, all explained. No filters. No overwhelm.&rdquo;</p>
          <div className="twy-author">
            <div className="twy-av">M</div>
            <div>
              <div className="twy-nm">Michiel van der Berg</div>
              <div className="twy-loc">Amsterdam, Netherlands</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
