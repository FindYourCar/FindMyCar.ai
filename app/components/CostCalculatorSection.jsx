"use client";

import React from "react";
import { CALC_DATA, calculateOwnership } from "@/lib/ownership";

// Inline "True cost of ownership" calculator — the single Cost Calculator in
// the app (replaces both the old standalone page-view and the modal). Pill
// toggles only (no dropdowns), real 4-market logic from lib/ownership.js, and
// a results panel that slides down when Calculate is pressed.

const COUNTRY_NAMES = { NL: "Netherlands", DE: "Germany", BE: "Belgium", PL: "Poland" };
const COUNTRY_FLAGS = { NL: "🇳🇱", DE: "🇩🇪", BE: "🇧🇪", PL: "🇵🇱" };
const SIZES = ["Small", "Compact", "Mid-Range", "Premium"];
const FUELS = ["Petrol", "Diesel", "Electric", "Hybrid"];
const AGES = ["New", "Nearly New", "Used", "Old"];
const PLN_PER_EUR = 4.35;

function OptGroup({ label, options, value, onChange, render }) {
  return (
    <div className="calc-group">
      <span className="calc-label">{label}</span>
      <div className="calc-opts">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            className={`calc-opt ${value === o ? "active" : ""}`}
            onClick={() => onChange(o)}
          >
            {render ? render(o) : o}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CostCalculatorSection() {
  const [country, setCountry] = React.useState("NL");
  const [size, setSize] = React.useState("Compact");
  const [fuel, setFuel] = React.useState("Petrol");
  const [age, setAge] = React.useState("Nearly New");
  const [price, setPrice] = React.useState("");
  const [km, setKm] = React.useState("");
  const [results, setResults] = React.useState(null);
  const [error, setError] = React.useState("");

  const isPLN = country === "PL";
  const currency = isPLN ? "zł" : "€";
  const fmt = (eur) =>
    isPLN
      ? Math.round(eur * PLN_PER_EUR).toLocaleString("pl-PL") + " zł"
      : "€" + Math.round(eur).toLocaleString("en-US");

  const calculate = () => {
    setError("");
    const priceNum = parseFloat(price);
    const kmNum = parseFloat(km);
    if (isNaN(priceNum) || priceNum <= 0) { setError("Enter a valid purchase price."); setResults(null); return; }
    if (isNaN(kmNum) || kmNum <= 0) { setError("Enter a valid yearly kilometre total."); setResults(null); return; }
    const priceInEur = isPLN ? priceNum / PLN_PER_EUR : priceNum;
    setResults(calculateOwnership({ country, size, fuel, price: priceInEur, age, km: kmNum }));
  };

  const reset = () => { setPrice(""); setKm(""); setResults(null); setError(""); };

  // Recompute live once results are showing, so changing a toggle updates them
  React.useEffect(() => {
    if (!results) return;
    const priceNum = parseFloat(price), kmNum = parseFloat(km);
    if (isNaN(priceNum) || priceNum <= 0 || isNaN(kmNum) || kmNum <= 0) return;
    const priceInEur = isPLN ? priceNum / PLN_PER_EUR : priceNum;
    setResults(calculateOwnership({ country, size, fuel, price: priceInEur, age, km: kmNum }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, size, fuel, age]);

  return (
    <section id="home-calculator" className="scroll-mt-24" style={{ borderTop: "1px solid var(--border)" }}>
      <style>{`
        .calc-wrap{max-width:1100px;margin:0 auto;padding:96px 24px}
        .calc-head{margin-bottom:40px}
        .calc-eyebrow{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--muted);display:flex;align-items:center;gap:8px;margin-bottom:12px}
        .calc-eyebrow i{width:6px;height:6px;border-radius:50%;background:var(--amber);box-shadow:0 0 10px rgba(251,191,36,.7)}
        .calc-h{font-family:'Fraunces',Georgia,serif;font-size:clamp(28px,4vw,46px);font-weight:600;letter-spacing:-.03em;color:#f9fafb;margin:0 0 12px;line-height:1.05}
        .calc-h em{font-style:italic;font-weight:300;color:#cdc6bc}
        .calc-sub{color:var(--muted);font-size:15px;line-height:1.65;max-width:60ch;margin:0}

        .calc-card{background:linear-gradient(180deg,#161310 0%,#0f0d0b 100%);border:1px solid var(--border);border-radius:24px;padding:32px;position:relative}
        .calc-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(251,191,36,.25),transparent)}
        .calc-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:22px}
        @media(max-width:760px){.calc-grid{grid-template-columns:1fr}}
        .calc-group{display:flex;flex-direction:column;gap:9px}
        .calc-label{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);font-weight:600}
        .calc-opts{display:flex;flex-wrap:wrap;gap:8px}
        .calc-opt{flex:1 1 auto;min-width:64px;padding:10px 14px;border-radius:11px;font-size:13px;font-weight:500;font-family:inherit;cursor:pointer;background:rgba(245,241,234,.03);border:1px solid var(--border);color:#f5f1ea;transition:border-color .2s ease,background .2s ease,color .2s ease,transform .2s ease;white-space:nowrap}
        .calc-opt:hover{border-color:rgba(251,191,36,.3);transform:translateY(-1px)}
        .calc-opt.active{background:rgba(251,191,36,.12);border-color:rgba(251,191,36,.45);color:#fbbf24}

        .calc-input-wrap{display:flex;align-items:center;background:rgba(10,9,8,.7);border:1px solid var(--border);border-radius:11px;overflow:hidden;transition:border-color .2s}
        .calc-input-wrap:focus-within{border-color:rgba(251,191,36,.45)}
        .calc-affix{padding:0 13px;color:var(--muted);font-size:14px;font-weight:600;flex-shrink:0;font-family:'Fraunces',Georgia,serif}
        .calc-input-wrap input{flex:1;min-width:0;background:transparent;border:none;outline:none;color:var(--text);font-size:15px;font-family:inherit;padding:12px 13px 12px 0}
        .calc-input-wrap .calc-affix.suffix{padding:0 13px 0 6px}

        .calc-actions{display:flex;gap:12px;margin-top:24px;flex-wrap:wrap}
        .calc-btn-go{flex:1;min-width:160px;background:linear-gradient(135deg,#fbbf24 0%,#d97706 50%,#92400e 100%);color:#1a0f00;font-weight:700;font-size:15px;border:none;border-radius:999px;padding:14px;cursor:pointer;font-family:inherit;transition:all .3s cubic-bezier(.2,.8,.2,1);box-shadow:0 8px 26px rgba(217,119,6,.3)}
        .calc-btn-go:hover{transform:translateY(-2px);box-shadow:0 14px 40px rgba(217,119,6,.45)}
        .calc-btn-reset{background:rgba(245,241,234,.04);border:1px solid var(--border);color:var(--text);border-radius:999px;padding:14px 26px;cursor:pointer;font-family:inherit;font-size:15px;transition:all .25s ease}
        .calc-btn-reset:hover{border-color:rgba(251,191,36,.35);color:#fbbf24}
        .calc-error{margin-top:16px;font-size:13px;color:#f87171;background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.2);border-radius:11px;padding:11px 14px}

        .calc-results{max-height:0;overflow:hidden;transition:max-height .55s cubic-bezier(.2,.8,.2,1),opacity .4s ease,margin-top .4s ease;opacity:0;margin-top:0}
        .calc-results.open{max-height:640px;opacity:1;margin-top:26px}
        .calc-results-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
        @media(max-width:760px){.calc-results-grid{grid-template-columns:repeat(2,1fr)}}
        .calc-stat{padding:22px;background:linear-gradient(180deg,#161310 0%,#0f0d0b 100%);border:1px solid var(--border);border-radius:18px;position:relative;text-align:center}
        .calc-stat::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;border-radius:18px 18px 0 0;background:linear-gradient(90deg,transparent,rgba(251,191,36,.22),transparent)}
        .calc-stat.total{border-color:rgba(251,191,36,.4);background:linear-gradient(180deg,rgba(251,191,36,.07),rgba(217,119,6,.03))}
        .calc-stat-n{font-family:'Fraunces',Georgia,serif;font-weight:700;letter-spacing:-.02em;color:var(--amber);line-height:1.05;font-size:26px}
        .calc-stat.total .calc-stat-n{font-size:34px}
        .calc-stat-l{font-size:11.5px;color:var(--muted);line-height:1.4;margin-top:6px}
        .calc-note{margin-top:18px;font-size:11.5px;color:var(--muted2,#5e574f);line-height:1.55;text-align:center}
        .calc-note a{color:var(--amber)}
      `}</style>

      <div className="calc-wrap">
        <div className="calc-head">
          <div className="calc-eyebrow"><i />Cost Calculator</div>
          <h2 className="calc-h">True cost of <em>ownership.</em></h2>
          <p className="calc-sub">
            See what a car actually costs you per year — fuel, road tax, maintenance and depreciation —
            across the Netherlands, Belgium, Germany and Poland. All figures based on official April 2026 data.
          </p>
        </div>

        <div className="calc-card">
          <div className="calc-grid">
            <OptGroup label="Country" options={["NL", "BE", "DE", "PL"]} value={country}
              onChange={(c) => { setCountry(c); }} render={(c) => `${COUNTRY_FLAGS[c]} ${COUNTRY_NAMES[c]}`} />
            <OptGroup label="Car size" options={SIZES} value={size} onChange={setSize} />
            <OptGroup label="Fuel type" options={FUELS} value={fuel} onChange={setFuel} />
            <OptGroup label="Car age" options={AGES} value={age} onChange={setAge} />

            <div className="calc-group">
              <span className="calc-label">Purchase price ({isPLN ? "PLN" : "EUR"})</span>
              <div className="calc-input-wrap">
                <span className="calc-affix">{currency}</span>
                <input type="number" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)}
                  placeholder={isPLN ? "110000" : "24000"} onKeyDown={(e) => e.key === "Enter" && calculate()} />
              </div>
            </div>

            <div className="calc-group">
              <span className="calc-label">Yearly kilometres</span>
              <div className="calc-input-wrap">
                <input type="number" inputMode="numeric" value={km} onChange={(e) => setKm(e.target.value)}
                  placeholder="15000" onKeyDown={(e) => e.key === "Enter" && calculate()} style={{ paddingLeft: 13 }} />
                <span className="calc-affix suffix">km</span>
              </div>
            </div>
          </div>

          {error && <div className="calc-error">{error}</div>}

          <div className="calc-actions">
            <button type="button" className="calc-btn-go" onClick={calculate}>Calculate</button>
            <button type="button" className="calc-btn-reset" onClick={reset}>Reset</button>
          </div>

          <div className={`calc-results ${results ? "open" : ""}`} aria-hidden={!results}>
            {results && (
              <>
                <div className="calc-results-grid">
                  <div className="calc-stat">
                    <div className="calc-stat-n">{fmt(results.fuel.yearly)}</div>
                    <div className="calc-stat-l">Annual fuel cost</div>
                  </div>
                  <div className="calc-stat">
                    <div className="calc-stat-n">{fmt(results.roadTax.yearly)}</div>
                    <div className="calc-stat-l">Road tax / year</div>
                  </div>
                  <div className="calc-stat">
                    <div className="calc-stat-n">{fmt(results.maintenance.yearly)}</div>
                    <div className="calc-stat-l">Maintenance est.</div>
                  </div>
                  <div className="calc-stat total">
                    <div className="calc-stat-n">{fmt(results.total.yearly)}</div>
                    <div className="calc-stat-l">Total cost / year</div>
                  </div>
                </div>
                <div className="calc-note">
                  Total cost of ownership also includes depreciation ({fmt(results.depreciation.yearly)}/yr) — about {fmt(results.total.monthly)}/month overall.
                  All figures are estimates based on official NL · BE · DE · PL data sources.
                  {CALC_DATA.officialLinks[country] && (
                    <> Source: <a href={CALC_DATA.officialLinks[country]} target="_blank" rel="noopener noreferrer">official tax authority</a>.</>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
