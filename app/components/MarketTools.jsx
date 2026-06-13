"use client";

import React from "react";
import { CALC_DATA, calculateOwnership, decodeVin } from "@/lib/ownership";

// Hero feature strip — three quick-access cards (Cost Calculator, VIN Checker,
// Live Markets). Cost Calculator and VIN Checker open modals backed by the real
// shared logic in lib/ownership.js (no mock values). Live Markets scrolls to the
// markets grid. Styling matches the provided fmc-feature-strip / fmc-modal CSS.

const COUNTRY_NAMES = { NL: "Netherlands", DE: "Germany", BE: "Belgium", PL: "Poland" };
const COUNTRY_FLAGS = { NL: "🇳🇱", DE: "🇩🇪", BE: "🇧🇪", PL: "🇵🇱" };
const SIZES = ["Small", "Compact", "Mid-Range", "Premium"];
const FUELS = ["Petrol", "Diesel", "Electric", "Hybrid"];
const AGES = ["New", "Nearly New", "Used", "Old"];
const PLN_PER_EUR = 4.35;

function Seg({ options, value, onChange, labels }) {
  return (
    <div className="fmc-seg">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          className={`fmc-seg-btn ${value === o ? "act" : ""}`}
          onClick={() => onChange(o)}
        >
          {labels ? labels[o] : o}
        </button>
      ))}
    </div>
  );
}

function CalcModal({ onClose }) {
  const [country, setCountry] = React.useState("NL");
  const [size, setSize] = React.useState("Compact");
  const [fuel, setFuel] = React.useState("Petrol");
  const [age, setAge] = React.useState("Nearly New");
  const [price, setPrice] = React.useState("");
  const [km, setKm] = React.useState("");
  const [results, setResults] = React.useState(null);
  const [error, setError] = React.useState("");

  const isPLN = country === "PL";
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
  const link = CALC_DATA.officialLinks[country];

  return (
    <ToolModal title="Cost Calculator" onClose={onClose}>
      <div className="fmc-field">
        <label>Country</label>
        <Seg options={["NL", "BE", "DE", "PL"]} value={country} onChange={(c) => { setCountry(c); setResults(null); }}
          labels={Object.fromEntries(Object.keys(COUNTRY_NAMES).map((c) => [c, `${COUNTRY_FLAGS[c]} ${COUNTRY_NAMES[c]}`]))} />
      </div>
      <div className="fmc-field"><label>Car size</label><Seg options={SIZES} value={size} onChange={setSize} /></div>
      <div className="fmc-field"><label>Fuel type</label><Seg options={FUELS} value={fuel} onChange={setFuel} /></div>
      <div className="fmc-field"><label>Car age</label><Seg options={AGES} value={age} onChange={setAge} /></div>
      <div className="fmc-field">
        <label>Purchase price ({isPLN ? "PLN" : "EUR"})</label>
        <input type="number" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)}
          placeholder={isPLN ? "e.g. 110000" : "e.g. 24000"} onKeyDown={(e) => e.key === "Enter" && calculate()} />
      </div>
      <div className="fmc-field">
        <label>Yearly kilometres</label>
        <input type="number" inputMode="numeric" value={km} onChange={(e) => setKm(e.target.value)}
          placeholder="e.g. 15000" onKeyDown={(e) => e.key === "Enter" && calculate()} />
      </div>

      {error && <div className="fmc-error">{error}</div>}

      <div className="fmc-modal-actions">
        <button type="button" className="fmc-btn-primary" onClick={calculate}>Calculate</button>
        <button type="button" className="fmc-btn-ghost" onClick={reset}>Reset</button>
      </div>

      {results && (
        <div className="fmc-calc-result">
          <div className="fmc-result-row"><span>Fuel / energy</span><span>{fmt(results.fuel.yearly)}/yr</span></div>
          <div className="fmc-result-row"><span>Road tax</span><span>{fmt(results.roadTax.yearly)}/yr</span></div>
          <div className="fmc-result-row"><span>Maintenance + inspection</span><span>{fmt(results.maintenance.yearly)}/yr</span></div>
          <div className="fmc-result-row"><span>Depreciation</span><span>{fmt(results.depreciation.yearly)}/yr</span></div>
          <div className="fmc-result-row fmc-result-total"><span>Total cost of ownership</span><span>{fmt(results.total.yearly)}/yr</span></div>
          <div className="fmc-result-row" style={{ borderBottom: "none", color: "var(--muted)" }}>
            <span>That&rsquo;s about</span><span>{fmt(results.total.monthly)}/mo</span>
          </div>
          <div className="fmc-disclaimer">
            Estimate based on official April 2026 data for {COUNTRY_NAMES[country]}.
            {link && <> Source: <a href={link} target="_blank" rel="noopener" style={{ color: "var(--amber)" }}>official tax authority</a>.</>}
          </div>
        </div>
      )}
    </ToolModal>
  );
}

function VinModal({ onClose }) {
  const [vin, setVin] = React.useState("");
  const decoded = React.useMemo(() => decodeVin(vin), [vin]);
  const cleanLen = vin.toUpperCase().replace(/[^A-Z0-9]/g, "").length;

  return (
    <ToolModal title="VIN Checker" onClose={onClose}>
      <div className="fmc-field">
        <label>Vehicle Identification Number (17 chars)</label>
        <input type="text" value={vin} maxLength={20} autoFocus
          onChange={(e) => setVin(e.target.value.toUpperCase())}
          placeholder="e.g. WBAWX31080P987654" style={{ letterSpacing: "0.05em", fontFamily: "ui-monospace, monospace" }} />
        <div className="fmc-hint-line">{cleanLen}/17 characters</div>
      </div>

      {decoded ? (
        <div className="fmc-vin-result">
          <div className="fmc-vin-row"><span className="fmc-vin-label">Manufacturer</span><span className="fmc-vin-val">{decoded.make}</span></div>
          <div className="fmc-vin-row"><span className="fmc-vin-label">Region of origin</span><span className="fmc-vin-val">{decoded.region}</span></div>
          <div className="fmc-vin-row"><span className="fmc-vin-label">Model year</span><span className="fmc-vin-val">{decoded.year}</span></div>
          <div className="fmc-vin-row"><span className="fmc-vin-label">Check digit (ISO 3779)</span><span className="fmc-vin-val">{decoded.checkText}</span></div>
          <div className="fmc-vin-row"><span className="fmc-vin-label">Stolen / write-off</span><span className="fmc-vin-val">No flags (demo) ✓</span></div>
          <div className="fmc-disclaimer">
            Structural decode only — manufacturer, origin and year are derived from the VIN itself.
            A full history report (mileage, damage, theft) connects to national registries on request.
          </div>
        </div>
      ) : (
        <div className="fmc-disclaimer" style={{ marginTop: 4 }}>
          Enter all 17 characters to decode manufacturer, origin, model year and validate the check digit.
        </div>
      )}
    </ToolModal>
  );
}

function ToolModal({ title, onClose, children }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div className="fmc-modal open" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="fmc-modal-box" role="dialog" aria-modal="true" aria-label={title}>
        <div className="fmc-modal-hdr">
          <div className="fmc-modal-title">{title}</div>
          <button className="fmc-modal-close" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="fmc-modal-body">{children}</div>
      </div>
    </div>
  );
}

export default function MarketTools() {
  const [modal, setModal] = React.useState(null); // 'calc' | 'vin' | null

  const goMarkets = () =>
    document.getElementById("home-markets")?.scrollIntoView({ behavior: "smooth", block: "start" });

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

        .fmc-modal{position:fixed;inset:0;background:rgba(5,4,3,0.78);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:9000;display:flex;align-items:flex-start;justify-content:center;padding:5vh 24px;overflow-y:auto;animation:fmcToolsFade .25s ease}
        .fmc-modal-box{background:linear-gradient(180deg,#1a1714 0%,#110f0c 100%);border:1px solid rgba(255,255,255,0.1);border-radius:20px;width:100%;max-width:480px;overflow:hidden;box-shadow:0 40px 80px rgba(0,0,0,0.7);animation:fmcToolsRise .35s cubic-bezier(.2,.8,.2,1)}
        .fmc-modal-hdr{padding:18px 22px;border-bottom:1px solid rgba(255,255,255,0.07);display:flex;align-items:center;justify-content:space-between}
        .fmc-modal-title{font-family:Fraunces,Georgia,serif;font-size:18px;font-weight:600;color:#f9fafb}
        .fmc-modal-close{width:30px;height:30px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:50%;color:#8a8178;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;flex-shrink:0}
        .fmc-modal-close:hover{background:rgba(251,191,36,0.1);color:#fbbf24;border-color:rgba(251,191,36,0.3)}
        .fmc-modal-body{padding:22px;display:flex;flex-direction:column;gap:14px}
        .fmc-field{display:flex;flex-direction:column;gap:7px}
        .fmc-field label{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#8a8178}
        .fmc-field input{background:rgba(10,9,8,0.7);border:1px solid var(--border);border-radius:10px;padding:11px 13px;color:var(--text);font-size:14px;font-family:inherit;outline:none;transition:border-color .2s;width:100%;box-sizing:border-box}
        .fmc-field input:focus{border-color:rgba(251,191,36,0.45)}
        .fmc-hint-line{font-size:11px;color:#5e574f}
        .fmc-seg{display:grid;grid-template-columns:repeat(2,1fr);gap:7px}
        .fmc-seg-btn{padding:10px 12px;border-radius:10px;font-size:13px;font-weight:500;font-family:inherit;cursor:pointer;transition:all .2s;background:rgba(245,241,234,0.03);border:1px solid var(--border);color:#f5f1ea;text-align:center}
        .fmc-seg-btn:hover{border-color:rgba(251,191,36,0.3)}
        .fmc-seg-btn.act{background:rgba(251,191,36,0.12);border-color:rgba(251,191,36,0.4);color:#fbbf24}
        .fmc-error{font-size:12.5px;color:#f87171;background:rgba(248,113,113,0.08);border:1px solid rgba(248,113,113,0.2);border-radius:10px;padding:9px 12px}
        .fmc-modal-actions{display:flex;gap:10px;margin-top:2px}
        .fmc-btn-primary{flex:1;background:linear-gradient(135deg,#fbbf24 0%,#d97706 50%,#92400e 100%);color:#1a0f00;font-weight:700;font-size:14px;border:none;border-radius:999px;padding:12px;cursor:pointer;font-family:inherit;transition:all .3s cubic-bezier(.2,.8,.2,1);box-shadow:0 8px 24px rgba(217,119,6,.3)}
        .fmc-btn-primary:hover{transform:translateY(-2px);box-shadow:0 12px 34px rgba(217,119,6,.45)}
        .fmc-btn-ghost{background:rgba(245,241,234,0.04);border:1px solid var(--border);color:var(--text);border-radius:999px;padding:12px 20px;cursor:pointer;font-family:inherit;font-size:14px;transition:all .25s ease}
        .fmc-btn-ghost:hover{border-color:rgba(251,191,36,0.35);color:#fbbf24}
        .fmc-calc-result,.fmc-vin-result{margin-top:6px;padding-top:14px;border-top:1px solid var(--border)}
        .fmc-result-row,.fmc-vin-row{display:flex;justify-content:space-between;gap:12px;font-size:13px;color:#8a8178;padding:8px 0;border-bottom:1px solid rgba(245,241,234,0.05)}
        .fmc-result-row span:last-child,.fmc-vin-val{color:var(--text);font-weight:500;white-space:nowrap}
        .fmc-vin-label{color:#8a8178}
        .fmc-result-total{border-bottom:none;margin-top:6px;padding-top:12px;border-top:1px solid var(--border-warm);color:var(--text);font-size:14px}
        .fmc-result-total span:last-child{color:var(--amber);font-family:'Fraunces',Georgia,serif;font-size:18px}
        .fmc-disclaimer{margin-top:12px;font-size:11px;line-height:1.55;color:#5e574f}
        @keyframes fmcToolsFade{from{opacity:0}to{opacity:1}}
        @keyframes fmcToolsRise{from{opacity:0;transform:translateY(22px) scale(.98)}to{opacity:1;transform:none}}
        @media (prefers-reduced-motion:reduce){.fmc-modal,.fmc-modal-box{animation:none}}
      `}</style>

      <div className="fmc-feature-strip">
        <button className="fmc-feat-card" type="button" onClick={() => setModal("calc")}>
          <span className="fmc-feat-ico">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M8 6h8M8 10h8M8 14h3M15 14h1M8 18h3M15 18h1" /></svg>
          </span>
          <span className="fmc-feat-text">
            <span className="fmc-feat-title">Cost Calculator</span>
            <span className="fmc-feat-sub">BPM · tax · total ownership</span>
          </span>
          <svg className="fmc-feat-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </button>

        <button className="fmc-feat-card" type="button" onClick={() => setModal("vin")}>
          <span className="fmc-feat-ico">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-5" /><path d="M12 3l7 4v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V7l7-4z" /></svg>
          </span>
          <span className="fmc-feat-text">
            <span className="fmc-feat-title">VIN Checker</span>
            <span className="fmc-feat-sub">History · mileage · stolen check</span>
          </span>
          <svg className="fmc-feat-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </button>

        <button className="fmc-feat-card" type="button" onClick={goMarkets}>
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

      {modal === "calc" && <CalcModal onClose={() => setModal(null)} />}
      {modal === "vin" && <VinModal onClose={() => setModal(null)} />}
    </div>
  );
}
