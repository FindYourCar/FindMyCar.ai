"use client";

import React from "react";
import { mkTr } from "./i18nHelper";

// Ukrainian copy for the visible card fronts + market names (the deep overlay
// data stays in English for now — it only opens on click and is data-heavy).
const MARKET_UK = {
  pl: { name: "Польща", eyebrow: "Польща · Розумна вигода", title: <>Широкий європейський ринок.<br /><em>Розумний вибір, реальна вигода.</em></>, stat: "Сильна пропозиція вживаних · зростання електрифікації" },
  ua: { name: "Україна", eyebrow: "Україна · Нові можливості", title: <>Ринок, що швидко змінюється.<br /><em>Обирайте авто впевнено.</em></>, stat: "Імпортна пропозиція · зростання інтересу до EV" },
};

// "Where do you want to find your car?" — bento grid of our two live markets,
// Poland and Ukraine. Clicking a card opens a qualitative market detail overlay
// (a snapshot, AI insight, popular models, what to expect, buying tips). The
// CTAs are wired to the real advisor chat via the onSearchMarket prop.
//
// Copy is deliberately qualitative: we do NOT quote precise market statistics,
// average prices, or specific listing prices we cannot verify.

const MARKET_DATA = {
  pl: {
    flag: "🇵🇱", name: "Poland", title: "The Polish Market",
    subtitle: "A broad European market — smart choices, real value.",
    img: "/media/markets/pl.jpg",
    cardEyebrow: "Poland · Value intelligence",
    cardTitle: <>A broad European market.<br /><em>Smart choices, real value.</em></>,
    cardStat: "Strong used-car supply · growing electrification",
    stats: [["Broad", "Used-car supply"], ["Growing", "EV & hybrid interest"], ["Value", "Price positioning"], ["Otomoto", "Primary marketplace"]],
    insight: "Poland has one of Europe's deepest used-car markets, with strong supply across mainstream brands and body styles, and electrification is growing steadily. Value-focused buyers have plenty of choice.",
    cars: [["Škoda Octavia", "Value all-rounder"], ["Toyota Corolla", "Reliability pick"], ["Volkswagen Passat", "Motorway cruiser"], ["Opel Astra", "Practical compact"]],
    prices: [["Marketplace", "Otomoto · otomoto.pl"], ["Supply", "Broad across segments"], ["Currency", "Polish złoty (PLN)"], ["Best for", "Value and choice"]],
    tips: ["Always run a full vehicle-history check before buying — it's the best protection against odometer issues.", "Otomoto has the deepest inventory; filter by year, mileage and fuel to narrow quickly.", "Compare a few similar listings to gauge a fair price before committing."],
  },
  ua: {
    flag: "🇺🇦", name: "Ukraine", title: "The Ukrainian Market",
    subtitle: "A fast-changing market — find the right car with confidence.",
    img: "/media/markets/ua.jpg",
    cardEyebrow: "Ukraine · Emerging opportunity",
    cardTitle: <>A fast-changing market.<br /><em>Find the right car with confidence.</em></>,
    cardStat: "Import-led supply · rising EV interest",
    stats: [["Emerging", "Growing marketplace"], ["Import-led", "Vehicle supply"], ["Rising", "EV interest"], ["AUTO.RIA", "Primary marketplace"]],
    insight: "Ukraine's car market is import-led and evolving quickly, with a wide mix of vehicles arriving from across Europe, and interest in EVs and hybrids is rising. AUTO.RIA is the country's main marketplace.",
    cars: [["Volkswagen Golf", "Popular hatch"], ["Škoda Octavia", "Practical family"], ["Nissan Leaf", "Popular used EV"], ["Toyota Camry", "Comfort sedan"]],
    prices: [["Marketplace", "AUTO.RIA · auto.ria.com"], ["Supply", "Import-led, wide variety"], ["Currency", "Ukrainian hryvnia (UAH)"], ["Best for", "Emerging EV & import choice"]],
    tips: ["AUTO.RIA is Ukraine's main marketplace — start there for the widest selection.", "For imported cars, check the full history and import documentation carefully.", "Used EVs and hybrids are increasingly available — worth considering for lower running costs."],
  },
};

const ORDER = ["pl", "ua"];

export default function MarketsBento({ onSearchMarket, lang = "EN" }) {
  const tr = mkTr(lang);
  const uk = lang === "UK";
  const [openKey, setOpenKey] = React.useState(null);
  const market = openKey ? MARKET_DATA[openKey] : null;

  // ESC closes, and the page never scrolls behind the overlay
  React.useEffect(() => {
    if (!openKey) return;
    const onKey = (e) => { if (e.key === "Escape") setOpenKey(null); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [openKey]);

  const search = (key) => {
    setOpenKey(null);
    onSearchMarket?.(uk
      ? `Покажи авто: ${MARKET_UK[key].name}`
      : `Show me cars in ${MARKET_DATA[key].name}`);
  };

  return (
    <section id="home-markets" className="scroll-mt-24">
      <style>{`
        #home-markets{max-width:1280px;margin:0 auto;padding:96px 24px}
        .fmcb-eyebrow{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--muted);display:flex;align-items:center;gap:8px}
        .fmcb-dot{width:6px;height:6px;border-radius:50%;background:var(--amber);box-shadow:0 0 10px rgba(251,191,36,.7);flex-shrink:0}
        .fmcb-title{font-family:'Fraunces',Georgia,serif;font-size:clamp(26px,3.8vw,44px);font-weight:600;letter-spacing:-.03em;color:#f9fafb;margin:10px 0;line-height:1.1}
        .fmcb-title em,.bento-title em{font-style:italic;background:linear-gradient(135deg,#fbbf24 0%,#d97706 50%,#92400e 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .fmcb-sub{color:var(--muted);font-size:15px;line-height:1.65;margin-top:10px;max-width:52ch}
        .bento-grid{display:grid;grid-template-columns:repeat(2,1fr);grid-auto-rows:minmax(220px,1fr);gap:12px;margin-top:56px}
        .bento-card{position:relative;background:#141210;border:1px solid var(--border);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end;padding:28px;cursor:pointer;transition:border-color .3s ease,transform .3s ease;background-size:cover;background-position:center;text-align:left;font-family:inherit;color:inherit;min-height:260px}
        .bento-card:hover{border-color:var(--border-warm);transform:translateY(-3px)}
        .bento-icon{position:absolute;top:20px;left:24px;font-size:28px}
        .bento-arrow{position:absolute;top:20px;right:20px;width:36px;height:36px;background:rgba(251,191,36,.1);border:1px solid var(--border-warm);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;color:var(--amber);transition:background .2s ease}
        .bento-card:hover .bento-arrow{background:rgba(251,191,36,.2)}
        .bento-explore{position:absolute;top:24px;right:64px;z-index:3;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;font-weight:600;color:var(--amber);background:rgba(10,9,8,.55);border:1px solid rgba(251,191,36,.25);border-radius:999px;padding:6px 12px;backdrop-filter:blur(6px);opacity:0;transform:translateX(6px);transition:opacity .3s ease,transform .3s ease;pointer-events:none}
        .bento-card:hover .bento-explore,.bento-card:focus-visible .bento-explore{opacity:1;transform:none}
        @media(hover:none){.bento-explore{opacity:1;transform:none}}
        .bento-body{position:relative;z-index:2}
        .bento-eyebrow{font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.82);margin-bottom:10px}
        .bento-title{font-family:'Fraunces',Georgia,serif;font-size:clamp(18px,2.2vw,26px);font-weight:600;color:#fff;line-height:1.15;margin-bottom:10px}
        .bento-stat{font-size:12px;color:#fff;font-weight:500}
        .bento-cta{position:relative;z-index:2;margin-top:18px;display:inline-flex;align-items:center;gap:6px;background:rgba(251,191,36,.08);border:1px solid var(--border-warm);border-radius:999px;padding:8px 16px;font-size:12.5px;color:var(--amber);font-family:inherit;cursor:pointer;transition:all .2s ease;width:fit-content}
        .bento-cta:hover{background:rgba(251,191,36,.15)}
        @media(max-width:768px){.bento-grid{grid-template-columns:1fr;grid-auto-rows:auto}.bento-card{min-height:220px}}

        .mkt-overlay{position:fixed;inset:0;z-index:320;display:flex;align-items:flex-start;justify-content:center;padding:4vh 18px;background:rgba(5,4,3,.78);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);overflow-y:auto;animation:fmcbFade .25s ease}
        .mkt-overlay-panel{width:min(880px,100%);background:linear-gradient(180deg,#161310 0%,#0f0d0b 100%);border:1px solid var(--border-warm);border-radius:22px;overflow:hidden;box-shadow:0 50px 120px rgba(0,0,0,.65);animation:fmcbRise .38s cubic-bezier(.2,.8,.2,1)}
        .mo-hero{position:relative;height:240px;background-size:cover;background-position:center}
        .mo-hero-overlay{position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,9,8,.25) 0%,rgba(10,9,8,.92) 100%)}
        .mo-hero-content{position:absolute;left:28px;right:28px;bottom:22px;z-index:2}
        .mo-flag{font-size:30px;margin-bottom:8px}
        .mo-title{font-family:'Fraunces',Georgia,serif;font-size:clamp(24px,3.4vw,34px);font-weight:600;color:#fff;letter-spacing:-.03em;line-height:1.1;margin:0}
        .mo-subtitle{margin:6px 0 0;font-size:13.5px;color:rgba(245,241,234,.78)}
        .mo-close{position:absolute;top:16px;right:16px;z-index:3;width:34px;height:34px;border-radius:50%;border:1px solid rgba(245,241,234,.25);background:rgba(10,9,8,.55);backdrop-filter:blur(6px);color:#f5f1ea;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s}
        .mo-close:hover{border-color:var(--amber);color:var(--amber)}
        .mo-body{padding:24px 28px 28px}
        .mo-stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
        @media(max-width:640px){.mo-stats-row{grid-template-columns:repeat(2,1fr)}}
        .mo-stat{background:rgba(245,241,234,.03);border:1px solid var(--border);border-radius:13px;padding:14px}
        .mo-stat-n{font-family:'Fraunces',Georgia,serif;font-size:21px;font-weight:600;color:var(--amber);line-height:1.1}
        .mo-stat-l{font-size:10.5px;color:var(--muted);margin-top:4px;line-height:1.4}
        .mo-insight-box{margin-top:14px;padding:16px 18px;background:rgba(251,191,36,.05);border:1px solid rgba(251,191,36,.18);border-radius:14px}
        .mo-insight-label{display:flex;align-items:center;gap:8px;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--amber);font-weight:600;margin-bottom:8px}
        .mo-pulse{width:7px;height:7px;border-radius:50%;background:var(--amber);box-shadow:0 0 9px rgba(251,191,36,.7);animation:fmcbPulse 2s ease-in-out infinite}
        .mo-insight-box p{margin:0;font-size:13px;line-height:1.65;color:#cdc6bc}
        .mo-section-title{font-family:'Fraunces',Georgia,serif;font-size:16px;font-weight:600;color:#f9fafb;margin:24px 0 12px}
        .mo-cars-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
        @media(max-width:560px){.mo-cars-grid{grid-template-columns:1fr}}
        .mo-car{display:flex;align-items:center;justify-content:space-between;gap:10px;background:rgba(245,241,234,.03);border:1px solid var(--border);border-radius:12px;padding:12px 15px}
        .mo-car-nm{font-size:13px;font-weight:600;color:var(--text)}
        .mo-car-tag{font-size:10.5px;color:var(--muted);margin-top:2px}
        .mo-car-pr{font-family:'Fraunces',Georgia,serif;font-size:15px;font-weight:600;color:var(--amber);white-space:nowrap}
        .mo-price-table{border:1px solid var(--border);border-radius:13px;overflow:hidden}
        .mo-price-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 16px;font-size:12.5px;color:var(--muted);border-bottom:1px solid rgba(245,241,234,.05)}
        .mo-price-row:last-child{border-bottom:none}
        .mo-price-row b{color:var(--text);font-weight:500}
        .mo-price-row .val{color:var(--text);font-weight:600;white-space:nowrap}
        .mo-tips{display:flex;flex-direction:column;gap:8px}
        .mo-tip{display:flex;gap:10px;align-items:flex-start;font-size:12.5px;line-height:1.6;color:#cdc6bc;background:rgba(245,241,234,.03);border:1px solid var(--border);border-radius:12px;padding:11px 14px}
        .mo-tip svg{flex-shrink:0;color:var(--amber);margin-top:2px}
        .mo-cta{margin-top:22px;display:flex;justify-content:center}
        .mo-cta-btn{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#fbbf24 0%,#d97706 50%,#92400e 100%);color:#1a0f00;font-weight:700;font-size:13.5px;border:1px solid rgba(251,191,36,.35);box-shadow:0 8px 28px rgba(217,119,6,.32),inset 0 1px 0 rgba(255,255,255,.38);border-radius:999px;padding:12px 26px;cursor:pointer;white-space:nowrap;transition:all .3s cubic-bezier(.2,.8,.2,1);font-family:inherit}
        .mo-cta-btn:hover{transform:translateY(-2px);box-shadow:0 14px 40px rgba(217,119,6,.5)}
        @keyframes fmcbFade{from{opacity:0}to{opacity:1}}
        @keyframes fmcbRise{from{opacity:0;transform:translateY(22px) scale(.98)}to{opacity:1;transform:none}}
        @keyframes fmcbPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.55;transform:scale(.8)}}
      `}</style>

      <div>
        <div className="fmcb-eyebrow"><span className="fmcb-dot" /> {tr("2 активні ринки", "2 Active Markets")}</div>
        <h2 className="fmcb-title">{tr(<>Де ви хочете знайти своє <em>авто?</em></>, <>Where do you want to find your <em>car?</em></>)}</h2>
        <p className="fmcb-sub">{tr("AI шукає живі оголошення в Польщі та Україні.", "AI searches live listings across Poland and Ukraine.")}</p>
      </div>

      <div className="bento-grid">
        {ORDER.map((key) => {
          const m = MARKET_DATA[key];
          const front = uk ? MARKET_UK[key] : { eyebrow: m.cardEyebrow, title: m.cardTitle, stat: m.cardStat };
          return (
            <div
              key={key}
              className="bento-card"
              role="button"
              tabIndex={0}
              style={{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0.78) 100%), url('${m.img}')` }}
              onClick={() => setOpenKey(key)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpenKey(key); } }}
              aria-label={`${m.name} market details`}
            >
              <div className="bento-icon" aria-hidden="true">{m.flag}</div>
              <div className="bento-arrow" aria-hidden="true">↗</div>
              <div className="bento-explore" aria-hidden="true">{tr("Огляд ↗", "Explore ↗")}</div>
              <div className="bento-body">
                <div className="bento-eyebrow">{front.eyebrow}</div>
                <h3 className="bento-title">{front.title}</h3>
                <div className="bento-stat">{front.stat}</div>
              </div>
              <button
                className="bento-cta"
                type="button"
                onClick={(e) => { e.stopPropagation(); search(key); }}
              >
                {tr(`Ринок ${key.toUpperCase()} →`, `Search ${key.toUpperCase()} market →`)}
              </button>
            </div>
          );
        })}
      </div>

      {market && (
        <div className="mkt-overlay" onClick={(e) => { if (e.target === e.currentTarget) setOpenKey(null); }}>
          <div className="mkt-overlay-panel" role="dialog" aria-modal="true" aria-labelledby="mo-title">
            <div className="mo-hero" style={{ backgroundImage: `url('${market.img}')` }}>
              <div className="mo-hero-overlay" />
              <div className="mo-hero-content">
                <div className="mo-flag" aria-hidden="true">{market.flag}</div>
                <h2 className="mo-title" id="mo-title">{uk ? `Ринок: ${MARKET_UK[openKey].name}` : market.title}</h2>
                <p className="mo-subtitle">{market.subtitle}</p>
              </div>
              <button className="mo-close" onClick={() => setOpenKey(null)} aria-label={tr("Закрити", "Close")}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="mo-body">
              <div className="mo-stats-row">
                {market.stats.map(([n, l], i) => (
                  <div className="mo-stat" key={i}><div className="mo-stat-n">{n}</div><div className="mo-stat-l">{l}</div></div>
                ))}
              </div>
              <div className="mo-insight-box">
                <div className="mo-insight-label"><span className="mo-pulse" /> {tr("AI-аналітика ринку", "AI Market Insight")}</div>
                <p>{market.insight}</p>
              </div>
              <div className="mo-section-title">{tr("Популярні моделі", "Popular Choices")}</div>
              <div className="mo-cars-grid">
                {market.cars.map(([nm, tag, pr], i) => (
                  <div className="mo-car" key={i}>
                    <div><div className="mo-car-nm">{nm}</div><div className="mo-car-tag">{tag}</div></div>
                    {pr && <div className="mo-car-pr">{pr}</div>}
                  </div>
                ))}
              </div>
              <div className="mo-section-title">{tr("Що очікувати", "What to Expect")}</div>
              <div className="mo-price-table">
                {market.prices.map(([k, v], i) => (
                  <div className="mo-price-row" key={i}><b>{k}</b><span className="val">{v}</span></div>
                ))}
              </div>
              <div className="mo-section-title">{tr("Поради щодо купівлі на цьому ринку", "Buying Tips for This Market")}</div>
              <div className="mo-tips">
                {market.tips.map((tip, i) => (
                  <div className="mo-tip" key={i}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 12 2 2 4-4" /><circle cx="12" cy="12" r="10" /></svg>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
              <div className="mo-cta">
                <button className="mo-cta-btn" type="button" onClick={() => search(openKey)}>
                  {tr("Шукати на цьому ринку", "Search this market")}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
