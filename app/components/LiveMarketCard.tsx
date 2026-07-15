"use client";

import React from "react";
import type { RawCarIntent } from "@/lib/autoscout/types";
import type { Recommendation } from "@/lib/recommendation";

// Renders one "Live market links" result. Takes a loose intent, calls the
// server route (the only place URLs are built/validated), and shows proper
// loading / success / no-match / error states — never a blank broken card.

type Phase = "loading" | "success" | "no_match" | "needs_clarification" | "error";

export default function LiveMarketCard({ intent, onPick }: { intent: RawCarIntent; onPick?: (text: string) => void }) {
  const [phase, setPhase] = React.useState<Phase>("loading");
  const [data, setData] = React.useState<Recommendation | null>(null);

  // Stable key so we only refetch when the intent actually changes.
  const intentKey = JSON.stringify(intent);

  React.useEffect(() => {
    let alive = true;
    setPhase("loading");
    setData(null);
    (async () => {
      try {
        const res = await fetch("/api/market-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: intentKey,
        });
        const json: Recommendation = await res.json();
        if (!alive) return;
        setData(json);
        setPhase(
          json.status === "success" ? "success"
            : json.status === "needs_clarification" ? "needs_clarification"
            : json.status === "no_match" ? "no_match"
            : "error",
        );
      } catch {
        if (alive) setPhase("error");
      }
    })();
    return () => { alive = false; };
  }, [intentKey]);

  return (
    <div className="lmc">
      <style>{`
        .lmc{overflow:hidden;border-radius:14px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);max-width:420px}
        .lmc-imgwrap{position:relative;aspect-ratio:16/7;max-height:150px;width:100%;overflow:hidden;background:linear-gradient(180deg,#161310,#0c0a08)}
        .lmc-img{height:100%;width:100%;object-fit:cover;object-position:center 42%;display:block}
        .lmc-body{padding:11px 13px}
        .lmc-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:7px}
        .lmc-title{font-size:13.5px;font-weight:600;color:#fff}
        .lmc-pill{border-radius:999px;background:rgba(255,255,255,.1);padding:2px 9px;font-size:10.5px;color:rgba(255,255,255,.72);white-space:nowrap}
        .lmc-specs{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px}
        .lmc-spec{font-size:10.5px;color:rgba(255,255,255,.72);background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:7px;padding:2px 7px}
        .lmc-hints{font-size:10.5px;color:rgba(255,255,255,.6);margin-bottom:9px;line-height:1.45}
        .lmc-hints-note{color:rgba(255,255,255,.38)}
        .lmc-flag{display:inline-flex;align-items:center;gap:6px;font-size:10.5px;margin-bottom:9px}
        .lmc-flag.ok{color:#4ade80}
        .lmc-flag.warn{color:#fbbf24}
        .lmc-cta{display:inline-flex;width:100%;align-items:center;justify-content:center;gap:7px;border-radius:10px;background:linear-gradient(135deg,#fbbf24,#d97706);padding:8px 12px;font-size:12.5px;font-weight:700;color:#1a0f00;transition:transform .2s,box-shadow .2s}
        .lmc-cta:hover{transform:translateY(-1px);box-shadow:0 10px 26px rgba(217,119,6,.4)}
        .lmc-msg{padding:22px 16px;text-align:center;color:rgba(255,255,255,.7);font-size:13px;line-height:1.6}
        .lmc-msg b{color:#f5f1ea;font-weight:600}
        .lmc-choices{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:12px}
        .lmc-choice{border-radius:999px;border:1px solid rgba(251,191,36,.35);background:rgba(251,191,36,.08);color:#fbbf24;font-size:12.5px;font-weight:600;padding:7px 14px;cursor:pointer;transition:all .2s;font-family:inherit}
        .lmc-choice:hover{background:rgba(251,191,36,.16);transform:translateY(-1px)}
        .lmc-skel{background:linear-gradient(90deg,rgba(255,255,255,.04) 25%,rgba(255,255,255,.09) 37%,rgba(255,255,255,.04) 63%);background-size:400% 100%;animation:lmcShimmer 1.4s ease infinite;border-radius:8px}
        .lmc-skel-line{height:11px;margin:8px 16px}
        @keyframes lmcShimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}
        @media (prefers-reduced-motion:reduce){.lmc-skel{animation:none}}
      `}</style>

      {phase === "loading" && (
        <>
          <div className="lmc-imgwrap lmc-skel" />
          <div style={{ padding: "14px 0" }}>
            <div className="lmc-skel lmc-skel-line" style={{ width: "55%" }} />
            <div className="lmc-skel lmc-skel-line" style={{ width: "80%" }} />
            <div className="lmc-skel lmc-skel-line" style={{ width: "40%", height: 30, borderRadius: 10 }} />
          </div>
        </>
      )}

      {phase === "success" && data && (
        <>
          <div className="lmc-imgwrap">
            <img
              className="lmc-img"
              src={data.imageUrl}
              alt={data.imageAlt}
              loading="lazy"
            />
          </div>
          <div className="lmc-body">
            <div className="lmc-row">
              <span className="lmc-title">{data.title}</span>
              <span className="lmc-pill">{data.sourceIntent.countryLabel}</span>
            </div>

            <div className="lmc-specs">
              {data.mileageTo != null && <span className="lmc-spec">≤ {data.mileageTo.toLocaleString()} km</span>}
              {data.priceTo != null && <span className="lmc-spec">≤ €{data.priceTo.toLocaleString()}</span>}
              {data.fuelType && <span className="lmc-spec">{data.fuelType.replace(/_/g, " ")}</span>}
              {data.gearbox && <span className="lmc-spec">{data.gearbox}</span>}
              {data.yearFrom && <span className="lmc-spec">from {data.yearFrom}</span>}
            </div>

            {data.sourceIntent.narrowingHints && data.sourceIntent.narrowingHints.length > 0 && (
              <div className="lmc-hints">
                Also matching: {data.sourceIntent.narrowingHints.join(" · ")}
                <span className="lmc-hints-note"> (refined as a hint, not a hard filter)</span>
              </div>
            )}

            {data.verified && !data.degraded && (
              <div className="lmc-flag ok">✓ Verified live results</div>
            )}
            {data.degraded && data.degradeReason && (
              <div className="lmc-flag warn">↓ {data.degradeReason}</div>
            )}
            {data.marketplace === "otomoto" && (
              <div className="lmc-flag warn">↳ {data.explanation || "Poland uses otomoto.pl, the local marketplace."}</div>
            )}
            {data.marketplace !== "otomoto" && data.explanation && !data.degraded && (
              <div className="lmc-flag warn">↳ {data.explanation}</div>
            )}

            <a className="lmc-cta" href={data.searchUrl} target="_blank" rel="noopener noreferrer">
              {data.marketplace === "otomoto" ? "View listings on otomoto.pl" : "View live listings on AutoScout24"}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </a>
          </div>
        </>
      )}

      {phase === "needs_clarification" && data && (
        <div className="lmc-msg">
          <b>{data.explanation || "Which model did you mean?"}</b>
          <div className="lmc-choices">
            {data.sourceIntent.modelCandidates.map((c) => {
              const label = `${data.sourceIntent.make ?? ""} ${c.display}`.trim();
              return (
                <button
                  key={c.slug}
                  type="button"
                  className="lmc-choice"
                  onClick={() => onPick?.(label)}
                >
                  {c.display}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {phase === "no_match" && (
        <div className="lmc-msg">
          <b>No exact market match</b>
          <br />
          {data?.explanation || "Try naming a brand, model, budget or mileage and I'll pull live listings."}
        </div>
      )}

      {phase === "error" && (
        <div className="lmc-msg">
          <b>Couldn’t reach the market right now</b>
          <br />
          {data?.explanation || "Please try that search again in a moment."}
        </div>
      )}
    </div>
  );
}
