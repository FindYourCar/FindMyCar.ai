"use client";

import React from "react";
import { mkTr } from "./i18nHelper";

// "The Digital Showroom" — BMW X7 rendered with <model-viewer> using the
// production-tuned settings (commerce tone mapping, neutral environment,
// soft contact shadow). The library is imported lazily when the section
// scrolls into view. Side indicator dots animate the camera between the
// market poses; model-viewer interpolates the orbit natively.

const POSES = [
  { az: 338, pol: 76, r: 3.8, name: "Poland" },
  { az: 272, pol: 78, r: 4.2, name: "Ukraine" },
];

export default function Showroom({ lang = "EN" }) {
  const tr = mkTr(lang);
  const stageRef = React.useRef(null);
  const mvRef = React.useRef(null);
  const [ready, setReady] = React.useState(false);   // model-viewer lib loaded
  const [loaded, setLoaded] = React.useState(false); // model itself loaded
  const [pct, setPct] = React.useState(0);
  const [hintHidden, setHintHidden] = React.useState(false);
  const [pose, setPose] = React.useState(0);

  // Load the model-viewer custom element only when the section approaches
  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        import("@google/model-viewer")
          .then(() => setReady(true))
          .catch((err) => console.error("[FindMyCar] model-viewer failed to load", err));
      }
    }, { rootMargin: "400px" });
    io.observe(stage);
    return () => io.disconnect();
  }, []);

  // Wire model events once the element exists
  React.useEffect(() => {
    if (!ready) return;
    const mv = mvRef.current;
    if (!mv) return;
    const onProgress = (e) => setPct(Math.round((e.detail?.totalProgress || 0) * 100));
    const onLoad = () => setLoaded(true);
    const onInteract = (e) => { if (e.detail?.source === "user-interaction") setHintHidden(true); };
    mv.addEventListener("progress", onProgress);
    mv.addEventListener("load", onLoad);
    mv.addEventListener("camera-change", onInteract);
    return () => {
      mv.removeEventListener("progress", onProgress);
      mv.removeEventListener("load", onLoad);
      mv.removeEventListener("camera-change", onInteract);
    };
  }, [ready]);

  const goPose = (i) => {
    setPose(i);
    const mv = mvRef.current;
    if (mv) {
      const p = POSES[i];
      mv.cameraOrbit = `${p.az}deg ${p.pol}deg ${p.r}m`;
    }
  };

  return (
    <section id="home-showroom" className="scroll-mt-24" style={{ position: "relative", borderTop: "1px solid var(--border)", overflow: "hidden", background: "linear-gradient(180deg,#0a0908 0%,#141210 45%,#0a0908 100%)" }}>
      <style>{`
        .shr-in{max-width:1280px;margin:0 auto;padding:96px 24px;position:relative;z-index:2;display:grid;grid-template-columns:1fr;gap:44px;align-items:center}
        @media(min-width:1024px){.shr-in{grid-template-columns:.85fr 1.15fr;gap:40px;padding:120px 24px}}
        .shr-copy{display:flex;flex-direction:column;gap:18px}
        .shr-eyebrow{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--muted);display:flex;align-items:center;gap:8px}
        .shr-dot{width:6px;height:6px;border-radius:50%;background:var(--amber);box-shadow:0 0 10px rgba(251,191,36,.7);flex-shrink:0}
        .shr-title{font-family:'Fraunces',Georgia,serif;font-size:clamp(26px,3.8vw,44px);font-weight:600;letter-spacing:-.03em;color:#f9fafb;margin:0;line-height:1.1}
        .shr-title em{font-style:italic;background:linear-gradient(135deg,#fbbf24 0%,#d97706 50%,#92400e 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .shr-copy p{font-size:14.5px;color:var(--muted);line-height:1.7;margin:0;max-width:460px}
        .shr-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}
        .shr-chip{font-family:ui-monospace,'JetBrains Mono',monospace;font-size:11px;letter-spacing:.06em;color:#cdc6bc;background:rgba(245,241,234,.03);border:1px solid var(--border);border-radius:999px;padding:6px 13px;white-space:nowrap}
        .shr-chip b{color:var(--amber);font-weight:600}
        .shr-feats{display:flex;flex-direction:column;gap:13px;margin-top:10px}
        .shr-feat{display:flex;gap:12px;align-items:flex-start}
        .shr-feat-ico{width:34px;height:34px;flex-shrink:0;border-radius:10px;display:flex;align-items:center;justify-content:center;background:rgba(251,191,36,.09);border:1px solid rgba(251,191,36,.18);color:var(--amber)}
        .shr-feat-t{font-size:14px;font-weight:600;color:var(--text);margin-bottom:2px}
        .shr-feat-d{font-size:12.5px;color:var(--muted);line-height:1.55}

        /* Stage */
        .shr-stage{position:relative;border-radius:24px;overflow:hidden;border:1px solid var(--border);box-shadow:0 30px 80px rgba(0,0,0,.55),inset 0 1px 0 rgba(245,241,234,.04);min-height:340px;height:clamp(340px,46vw,560px);background:linear-gradient(180deg,#110f0c 0%,#0c0a08 100%)}
        .shr-bg{position:absolute;inset:0;z-index:0;pointer-events:none;background:radial-gradient(85% 65% at 50% 100%,rgba(251,191,36,.08) 0%,transparent 60%),radial-gradient(60% 45% at 50% 0%,rgba(245,241,234,.03) 0%,transparent 70%)}
        .shr-topline{height:1px;position:absolute;top:0;left:0;right:0;z-index:3;background:linear-gradient(90deg,transparent,rgba(251,191,36,.3),transparent)}
        model-viewer.shr-mv{position:absolute;inset:0;z-index:2;width:100%;height:100%;background:transparent;--poster-color:transparent;outline:none;border:none;cursor:grab}
        model-viewer.shr-mv:active{cursor:grabbing}
        model-viewer.shr-mv::part(default-progress-bar){display:none}
        model-viewer.shr-mv::part(default-ar-button){display:none}
        model-viewer.shr-mv::part(default-progress-mask){display:none}

        /* Headlights + ground glow */
        .shr-hl-l,.shr-hl-r{position:absolute;bottom:30%;width:160px;height:100px;pointer-events:none;z-index:4;border-radius:50%;filter:blur(26px);animation:shrHl 3.5s ease-in-out infinite}
        .shr-hl-l{left:10%;background:radial-gradient(ellipse,rgba(220,235,255,.6) 0%,rgba(180,210,255,.28) 40%,transparent 70%)}
        .shr-hl-r{right:10%;background:radial-gradient(ellipse,rgba(220,235,255,.6) 0%,rgba(180,210,255,.28) 40%,transparent 70%)}
        .shr-ground{position:absolute;bottom:10%;left:50%;transform:translateX(-50%);width:440px;height:55px;background:radial-gradient(ellipse,rgba(251,191,36,.13) 0%,rgba(217,119,6,.06) 50%,transparent 70%);filter:blur(16px);pointer-events:none;z-index:3;border-radius:50%}
        @keyframes shrHl{0%,100%{opacity:.65}50%{opacity:1}}
        @media(prefers-reduced-motion:reduce){.shr-hl-l,.shr-hl-r{animation:none}}

        /* Side indicator dots */
        .shr-si{position:absolute;right:16px;top:50%;transform:translateY(-50%);z-index:5;display:flex;flex-direction:column;gap:12px}
        .shr-si-dot{width:9px;height:9px;border-radius:50%;border:1px solid rgba(251,191,36,.4);background:rgba(251,191,36,.08);cursor:pointer;padding:0;transition:all .3s ease}
        .shr-si-dot:hover{border-color:var(--amber);background:rgba(251,191,36,.25)}
        .shr-si-dot.act{background:var(--amber);border-color:var(--amber);box-shadow:0 0 10px rgba(251,191,36,.7)}

        /* Label card */
        .shr-badge{position:absolute;top:16px;left:16px;z-index:5;display:flex;flex-direction:column;gap:2px;background:rgba(10,9,8,.55);border:1px solid var(--border);border-radius:14px;padding:10px 16px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);pointer-events:none}
        .shr-badge-t{font-family:'Fraunces',Georgia,serif;font-size:15px;font-weight:600;color:#f9fafb}
        .shr-badge-s{font-family:ui-monospace,'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--amber)}

        /* Loader + hint */
        .shr-load{position:absolute;inset:0;z-index:6;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:linear-gradient(180deg,#110f0c,#0c0a08);transition:opacity .6s ease}
        .shr-load.done{opacity:0;pointer-events:none}
        .shr-ring{width:44px;height:44px;border-radius:50%;border:2px solid rgba(251,191,36,.15);border-top-color:var(--amber);animation:shrSpin .9s linear infinite}
        @keyframes shrSpin{to{transform:rotate(360deg)}}
        .shr-load-txt{font-family:ui-monospace,'JetBrains Mono',monospace;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted)}
        .shr-load-txt b{color:var(--amber);font-weight:600}
        .shr-hint{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);z-index:5;display:flex;align-items:center;gap:9px;background:rgba(10,9,8,.6);border:1px solid var(--border);border-radius:999px;padding:7px 16px;font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;color:#cdc6bc;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);pointer-events:none;transition:opacity .5s ease}
        .shr-hint.hide{opacity:0}
        .shr-hint svg{color:var(--amber)}
        @media(max-width:640px){.shr-stage{height:320px;border-radius:18px}.shr-badge{padding:8px 12px}.shr-si{right:10px}}
      `}</style>

      <div className="shr-in">
        <div className="shr-copy">
          <div className="shr-eyebrow"><span className="shr-dot" /> {tr("Цифровий шоурум", "The Digital Showroom")}</div>
          <h2 className="shr-title">{tr(<>Знайте авто.<br /><em>Ще до того, як побачите його.</em></>, <>Know the car.<br /><em>Before you ever see it.</em></>)}</h2>
          <p>{tr("Кожна порада — з повною картиною: перевірена історія, реальна комплектація і те, де ціна стоїть на ринку. Радник вивчає кожне авто так, як ви б хотіли: з усіх боків.", "Every recommendation comes with the full picture — verified history, true spec, and where the price sits in the market. The advisor studies each car the way you’d want to: from every angle.")}</p>
          <p>{tr("Спробуйте це авто. Покрутіть його — воно рендериться наживо у вашому браузері.", "Take this one for a spin. Drag it around — it’s rendered live in your browser.")}</p>
          <div className="shr-chips">
            <span className="shr-chip"><b>BMW</b> X7 M60i</span>
            <span className="shr-chip">4.4L V8 · 530 {tr("к.с.", "hp")}</span>
            <span className="shr-chip">xDrive AWD</span>
            <span className="shr-chip">{tr("7 місць", "7 seats")}</span>
          </div>
          <div className="shr-feats">
            <div className="shr-feat">
              <div className="shr-feat-ico">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18M3 12h18" /></svg>
              </div>
              <div>
                <div className="shr-feat-t">{tr("360° знань, жодних здогадок", "360° knowledge, zero guesswork")}</div>
                <div className="shr-feat-d">{tr("Характеристики, комплектації та відомі слабкі місця — ще до того, як ви поїдете на огляд.", "Spec sheets, trim levels and known weak points — surfaced before you commit to a viewing.")}</div>
              </div>
            </div>
            <div className="shr-feat">
              <div className="shr-feat-ico">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-5" /><path d="M12 3l7 4v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V7l7-4z" /></svg>
              </div>
              <div>
                <div className="shr-feat-t">{tr("Історія за VIN", "VIN-checked history")}</div>
                <div className="shr-feat-d">{tr("Перевірка пробігу, пошкоджень і викрадення в європейських реєстрах.", "Mileage, damage and stolen-vehicle checks across European registries.")}</div>
              </div>
            </div>
            <div className="shr-feat">
              <div className="shr-feat-ico">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 17l5-5 4 4 8-8" /><path d="M14 7h7v7" /></svg>
              </div>
              <div>
                <div className="shr-feat-t">{tr("Позиція ціни на ринку", "Market price position")}</div>
                <div className="shr-feat-d">{tr("Побачте, це вигідна пропозиція чи націнка — у Польщі та Україні.", "See whether a listing is a deal or a markup — across Poland and Ukraine at once.")}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="shr-stage" ref={stageRef} aria-label="Interactive 3D model of a BMW X7 M60i. Drag to rotate.">
          <div className="shr-bg" aria-hidden="true" />
          <div className="shr-topline" aria-hidden="true" />

          {ready && (
            <model-viewer
              ref={mvRef}
              class="shr-mv"
              id="bmw-j"
              src="/media/bmw-x7.glb"
              alt="BMW X7 2024"
              camera-orbit={`${POSES[0].az}deg ${POSES[0].pol}deg ${POSES[0].r}m`}
              field-of-view="22deg"
              shadow-intensity="2.4"
              shadow-softness="0.55"
              exposure="1.35"
              environment-image="neutral"
              tone-mapping="commerce"
              interaction-prompt="none"
              interpolation-decay="60"
              auto-rotate=""
              auto-rotate-delay="0"
              rotation-per-second="6deg"
              camera-controls=""
              disable-zoom=""
              loading="eager"
              reveal="auto"
            />
          )}

          <div className="shr-hl-l" aria-hidden="true" />
          <div className="shr-hl-r" aria-hidden="true" />
          <div className="shr-ground" aria-hidden="true" />

          <div className="shr-si" role="group" aria-label="Camera angles">
            {POSES.map((p, i) => (
              <button
                key={p.name}
                type="button"
                className={`shr-si-dot ${pose === i ? "act" : ""}`}
                title={p.name}
                aria-label={`View from ${p.name} angle`}
                onClick={() => goPose(i)}
              />
            ))}
          </div>

          <div className="shr-badge" aria-hidden="true">
            <div className="shr-badge-t">BMW X7 M60i</div>
            <div className="shr-badge-s">{tr("Живе 3D · у браузері", "Live 3D · in-browser")}</div>
          </div>

          <div className={`shr-hint ${hintHidden ? "hide" : ""}`} aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v6M10 10.5V6a2 2 0 0 0-4 0v8" /><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" /></svg>
            {tr("Тягніть, щоб обертати", "Drag to rotate")}
          </div>

          <div className={`shr-load ${loaded ? "done" : ""}`}>
            <div className="shr-ring" aria-hidden="true" />
            <div className="shr-load-txt">{tr("Завантаження моделі", "Loading model")} · <b>{pct}%</b></div>
          </div>
        </div>
      </div>
    </section>
  );
}
