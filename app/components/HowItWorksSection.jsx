"use client";

import React from "react";

// "Three steps to confident." — the process section ported from the concept
// artifact. Keeps id="home-how" so existing nav links and the spine rail
// continue to target it.
export default function HowItWorksSection() {
  return (
    <section
      id="home-how"
      className="scroll-mt-24"
      style={{ background: "linear-gradient(180deg,#0a0908,#141210 50%,#0a0908)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}
    >
      <style>{`
        .hiw-wrap{max-width:1280px;margin:0 auto;padding:96px 24px}
        .hiw-head{text-align:center;max-width:600px;margin:0 auto 56px}
        .hiw-eyebrow{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--muted);display:flex;align-items:center;gap:8px;justify-content:center;margin-bottom:12px}
        .hiw-dot{width:6px;height:6px;border-radius:50%;background:var(--amber);box-shadow:0 0 10px rgba(251,191,36,.7);flex-shrink:0}
        .hiw-title{font-family:'Fraunces',Georgia,serif;font-size:clamp(26px,3.8vw,44px);font-weight:600;letter-spacing:-.03em;color:#f9fafb;margin:10px 0;line-height:1.1}
        .hiw-title em{font-style:italic;background:linear-gradient(135deg,#fbbf24 0%,#d97706 50%,#92400e 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .hiw-sub{color:var(--muted);font-size:15px;line-height:1.65;margin:10px auto 0;max-width:52ch}
        .hiw-grid{display:grid;grid-template-columns:1fr;gap:18px}
        @media(min-width:768px){.hiw-grid{grid-template-columns:repeat(3,1fr)}}
        .hiw-step{background:linear-gradient(180deg,#161310 0%,#0f0d0b 100%);border:1px solid var(--border);border-radius:20px;padding:32px;position:relative;overflow:hidden;transition:all .35s ease}
        .hiw-step::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(251,191,36,.28),transparent)}
        .hiw-step:hover{border-color:rgba(251,191,36,.22);transform:translateY(-4px);box-shadow:0 20px 55px rgba(0,0,0,.48)}
        .hiw-n{font-family:'Fraunces',Georgia,serif;font-size:46px;font-weight:700;color:rgba(251,191,36,.13);line-height:1;margin-bottom:18px;letter-spacing:-.05em}
        .hiw-ico{width:42px;height:42px;background:rgba(251,191,36,.09);border:1px solid rgba(251,191,36,.18);border-radius:11px;display:flex;align-items:center;justify-content:center;color:var(--amber);margin-bottom:18px}
        .hiw-t{font-family:'Fraunces',Georgia,serif;font-size:21px;font-weight:600;color:#f9fafb;margin-bottom:10px}
        .hiw-b{font-size:13.5px;color:var(--muted);line-height:1.65}
        .hiw-ex{margin-top:18px;background:rgba(245,241,234,.03);border:1px solid var(--border);border-radius:11px;padding:13px}
        .hiw-me-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
        .hiw-me-nm{font-size:13px;font-weight:600;color:var(--text)}
        .hiw-me-pct{font-family:'Fraunces',serif;font-size:15px;font-weight:600;color:var(--amber)}
        .hiw-bar-t{height:4px;border-radius:999px;background:rgba(245,241,234,.06);overflow:hidden}
        .hiw-bar-f{height:100%;background:linear-gradient(90deg,#92400e,var(--amber));border-radius:999px}
      `}</style>

      <div className="hiw-wrap">
        <div className="hiw-head">
          <div className="hiw-eyebrow"><span className="hiw-dot" /> The process</div>
          <h2 className="hiw-title">Three steps to <em>confident.</em></h2>
          <p className="hiw-sub">No filtering through 47 dropdowns. No ads. No pressure. Just honest guidance from an AI built to find the right car — not the most expensive one.</p>
        </div>

        <div className="hiw-grid">
          <div className="hiw-step">
            <div className="hiw-n">01</div>
            <div className="hiw-ico">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            </div>
            <div className="hiw-t">Chat with the advisor</div>
            <p className="hiw-b">Describe what you need in plain language — budget, use case, family size, how you drive. The advisor asks real follow-up questions, like a knowledgeable friend.</p>
            <div className="hiw-ex">
              <p style={{ fontSize: "12.5px", color: "#cdc6bc", lineHeight: 1.5, margin: 0 }}>
                <span style={{ color: "var(--muted)" }}>You:</span> &ldquo;Two kids, one dog, weekend B-roads, under €35k&rdquo;<br />
                <span style={{ color: "var(--amber)" }}>Advisor:</span> &ldquo;Do you prioritise boot space or driving feel?&rdquo;
              </p>
            </div>
          </div>

          <div className="hiw-step">
            <div className="hiw-n">02</div>
            <div className="hiw-ico">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></svg>
            </div>
            <div className="hiw-t">Smart recommendations</div>
            <p className="hiw-b">The AI surfaces cars matched to what you described — scored by fit, not by sponsorship. Each match comes with a confidence percentage and a reason why.</p>
            <div className="hiw-ex">
              <div className="hiw-me-h">
                <span className="hiw-me-nm">Audi A4 Avant</span>
                <span className="hiw-me-pct">94%</span>
              </div>
              <div className="hiw-bar-t"><div className="hiw-bar-f" style={{ width: "94%" }} /></div>
              <p style={{ fontSize: "11.5px", color: "var(--muted)", marginTop: 7, lineHeight: 1.4, marginBottom: 0 }}>Estate + rear seats + B-roads + within budget</p>
            </div>
          </div>

          <div className="hiw-step">
            <div className="hiw-n">03</div>
            <div className="hiw-ico">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            </div>
            <div className="hiw-t">Browse live offers</div>
            <p className="hiw-b">See live listings from dealers and private sellers across NL, BE, DE and PL — filtered to your match, sorted by value, with cross-market price comparison.</p>
            <div className="hiw-ex">
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12.5px" }}>
                  <span style={{ color: "#cdc6bc" }}>Dealer · Amsterdam</span>
                  <span style={{ fontFamily: "'Fraunces',Georgia,serif", color: "var(--amber)" }}>€28,400</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12.5px" }}>
                  <span style={{ color: "#cdc6bc" }}>Private · Antwerp</span>
                  <span style={{ fontFamily: "'Fraunces',Georgia,serif", color: "#34d399" }}>€26,900 ↓</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
