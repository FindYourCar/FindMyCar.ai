"use client";

import React from "react";

// Cinematic entry layer — fullscreen video, brief brand copy, "Explore" CTA.
// On explore: sports-car acceleration FX (video speed-up + zoom + speed lines
// + flash), then the layer leaves and the real homepage settles in.
//
// Uses the same Cloudinary hero videos as the production hero so it works
// in deployed environments where /public/media is not shipped.
const INTRO_VIDEOS = [
  "https://res.cloudinary.com/df4m9e0ob/video/upload/v1779230148/Hero-06_rosiqi.mp4",
  "https://res.cloudinary.com/df4m9e0ob/video/upload/v1779230150/Hero-01_nwecg8.mp4",
  "https://res.cloudinary.com/df4m9e0ob/video/upload/v1781695688/Hero-03_apbgz1.mp4",
  "https://res.cloudinary.com/df4m9e0ob/video/upload/v1779230150/Hero-07_gswtag.mp4",
  "https://res.cloudinary.com/df4m9e0ob/video/upload/v1779230147/Hero-02_w9jaow.mp4",
  "https://res.cloudinary.com/df4m9e0ob/video/upload/v1779230163/Hero-04_nlp39h.mp4",
  "https://res.cloudinary.com/df4m9e0ob/video/upload/v1779230159/Hero-05_tbc7ym.mp4",
  "https://res.cloudinary.com/df4m9e0ob/video/upload/v1781695752/Hero-08_wdihgg.mp4",
];

const SPEED_LINES = Array.from({ length: 30 }, (_, i) => ({
  top: (i * 37 + 13) % 100,
  dur: 0.32 + ((i * 7919) % 40) / 100,
  del: ((i * 104729) % 50) / 100,
  opa: 0.35 + ((i * 31) % 65) / 100,
  h: 1 + ((i * 13) % 24) / 10,
}));

export default function CinematicIntro({ onDone, lang = "EN" }) {
  const uk = lang === "UK";
  const tr = (u, e) => (uk ? u : e);
  const [phase, setPhase] = React.useState("idle"); // idle | accel | gone
  // Fixed index for SSR; randomized after mount so server and client markup match
  const [vidIdx, setVidIdx] = React.useState(0);
  React.useEffect(() => {
    setVidIdx(Math.floor(Math.random() * INTRO_VIDEOS.length));
  }, []);
  const vidRef = React.useRef(null);
  const flashRef = React.useRef(null);
  const phaseRef = React.useRef("idle");
  phaseRef.current = phase;

  // Never block the Supabase password-recovery flow: if the URL carries
  // recovery/auth tokens, skip the intro entirely.
  React.useEffect(() => {
    const h = window.location.hash || "";
    const q = window.location.search || "";
    if (h.includes("access_token") || h.includes("type=recovery") || q.includes("nointro")) {
      setPhase("gone");
      onDone?.({ instant: true });
    }
  }, [onDone]);

  // Lock page scroll while the gate is up
  React.useEffect(() => {
    if (phase === "gone") return;
    const el = document.documentElement;
    el.style.overflow = "hidden";
    return () => { el.style.overflow = ""; };
  }, [phase]);

  const reduced = () => {
    try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; }
  };

  const explore = React.useCallback(() => {
    if (phaseRef.current !== "idle") return;

    // Leave phase: the gate dissolves (opacity + scale, GPU-composited)
    // over the already-rendered homepage, then unmounts. No abrupt pop.
    const finish = (instant) => {
      setPhase("leave");
      window.scrollTo(0, 0);
      onDone?.({ instant });
      setTimeout(() => setPhase("gone"), instant ? 320 : 620);
    };

    if (reduced()) { finish(true); return; }

    setPhase("accel");
    try { if (vidRef.current) vidRef.current.playbackRate = 2.5; } catch {}
    setTimeout(() => {
      flashRef.current?.animate(
        [{ opacity: 0 }, { opacity: 0.95, offset: 0.45 }, { opacity: 0 }],
        { duration: 480, easing: "ease-out" }
      );
    }, 820);
    setTimeout(() => finish(false), 1020);
  }, [onDone]);

  // Scroll / swipe / Enter also launch
  React.useEffect(() => {
    if (phase !== "idle") return;
    const onWheel = (e) => { if (e.deltaY > 12) explore(); };
    const onKey = (e) => { if (e.key === "Enter" || e.key === " ") explore(); };
    let touchY = null;
    const onTouchStart = (e) => { touchY = e.touches[0].clientY; };
    const onTouchMove = (e) => {
      if (touchY !== null && touchY - e.touches[0].clientY > 36) { explore(); touchY = null; }
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [phase, explore]);

  if (phase === "gone") return null;

  return (
    <div className={`fmc-gate ${phase === "accel" || phase === "leave" ? "accel" : ""} ${phase === "leave" ? "leave" : ""}`} role="dialog" aria-label="Welcome to FindMyCar">
      <style>{`
        .fmc-gate{position:fixed;inset:0;z-index:400;background:#050403;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between}
        .fmc-gate-vid{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;transform-origin:50% 42%;filter:saturate(1.05) contrast(1.04);transition:transform 1.1s cubic-bezier(.55,0,.85,.4)}
        .fmc-gate.accel .fmc-gate-vid{transform:scale(1.32)}
        .fmc-gate-grade{position:absolute;inset:0;z-index:1;pointer-events:none;background:radial-gradient(120% 90% at 18% 88%,rgba(5,4,3,0.72) 0%,rgba(5,4,3,0.18) 45%,transparent 70%),linear-gradient(180deg,rgba(5,4,3,0.62) 0%,rgba(5,4,3,0.10) 30%,rgba(5,4,3,0.16) 62%,rgba(5,4,3,0.88) 100%)}
        .fmc-gate-top{position:relative;z-index:3;display:flex;align-items:center;justify-content:space-between;padding:26px clamp(22px,4.5vw,56px) 0;animation:fmcGateDown 1s cubic-bezier(.16,1,.3,1) .25s both}
        .fmc-gate-logo{display:flex;align-items:center;gap:10px}
        .fmc-gate-logo-w{font-family:'Fraunces',Georgia,serif;font-weight:600;font-size:20px;letter-spacing:-0.02em;color:#f9fafb}
        .fmc-gate-logo-w em{font-style:italic;color:#fbbf24}
        .fmc-gate-mkts{font-family:ui-monospace,'JetBrains Mono',monospace;font-size:11px;letter-spacing:.18em;color:#8a8178;display:flex;align-items:center;gap:10px;white-space:nowrap}
        .fmc-gate-mkts b{color:#cdc6bc;font-weight:500}
        @media(max-width:560px){.fmc-gate-mkts{letter-spacing:.1em;gap:6px}.fmc-gate-mkts .mkts-tail{display:none}}
        .fmc-gate-content{position:relative;z-index:3;max-width:780px;padding:0 clamp(22px,4.5vw,56px) clamp(30px,5.5vh,64px);display:flex;flex-direction:column;gap:20px}
        .fmc-gate-badge{display:inline-flex;align-items:center;gap:9px;width:fit-content;background:rgba(10,9,8,0.55);border:1px solid rgba(251,191,36,0.22);border-radius:999px;padding:7px 16px;font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:#cdc6bc;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);animation:fmcGateUp .9s cubic-bezier(.16,1,.3,1) .45s both}
        .fmc-gate-pulse{display:inline-block;width:7px;height:7px;border-radius:50%;background:#34d399;box-shadow:0 0 10px rgba(52,211,153,0.6);animation:fmcPulse 2s ease-in-out infinite}
        .fmc-gate-title{font-family:'Fraunces',Georgia,serif;font-weight:600;letter-spacing:-0.035em;line-height:1.04;font-size:clamp(38px,6.2vw,76px);color:#f9fafb;margin:0;animation:fmcGateUp 1s cubic-bezier(.16,1,.3,1) .58s both}
        .fmc-gate-title em{font-style:italic;background:linear-gradient(135deg,#fbbf24 0%,#d97706 50%,#92400e 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .fmc-gate-sub{font-size:clamp(14px,1.35vw,16.5px);color:#cdc6bc;line-height:1.65;max-width:540px;margin:0;animation:fmcGateUp 1s cubic-bezier(.16,1,.3,1) .72s both}
        .fmc-gate-row{display:flex;align-items:center;gap:18px;flex-wrap:wrap;margin-top:6px;animation:fmcGateUp 1s cubic-bezier(.16,1,.3,1) .86s both}
        .fmc-gate-cta{display:inline-flex;align-items:center;gap:11px;background:linear-gradient(135deg,#fbbf24 0%,#d97706 50%,#92400e 100%);color:#1a0f00;font-weight:700;font-size:15px;border:1px solid rgba(251,191,36,0.35);box-shadow:0 8px 28px rgba(217,119,6,0.32),inset 0 1px 0 rgba(255,255,255,0.38);border-radius:999px;padding:15px 30px;cursor:pointer;white-space:nowrap;transition:all .3s cubic-bezier(.2,.8,.2,1);font-family:inherit}
        .fmc-gate-cta:hover{transform:translateY(-2px);box-shadow:0 14px 40px rgba(217,119,6,0.5),inset 0 1px 0 rgba(255,255,255,0.5)}
        .fmc-gate-cta:hover svg{transform:translateX(4px)}
        .fmc-gate-cta:active{transform:scale(.97)}
        .fmc-gate-cta svg{transition:transform .3s cubic-bezier(.2,.8,.2,1)}
        .fmc-gate-hint{font-family:ui-monospace,'JetBrains Mono',monospace;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#8a8178;display:flex;align-items:center;gap:9px}
        .fmc-gate-hint i{width:5px;height:5px;border-radius:50%;background:#fbbf24;box-shadow:0 0 8px rgba(251,191,36,.7);animation:fmcPulse 2s ease-in-out infinite}
        .fmc-gate-cue{position:absolute;bottom:clamp(28px,5vh,58px);right:clamp(22px,4.5vw,56px);z-index:3;display:flex;flex-direction:column;align-items:center;gap:10px;color:#8a8178;font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;animation:fmcGateUp 1s ease 1.15s both}
        .fmc-gate-cue-line{width:1px;height:42px;background:linear-gradient(180deg,#fbbf24,transparent);animation:fmcCue 1.8s ease-in-out infinite}
        .fmc-gate-lines{position:absolute;inset:0;z-index:4;opacity:0;pointer-events:none;overflow:hidden}
        .fmc-gate.accel .fmc-gate-lines{opacity:1}
        .fmc-gate-lines span{position:absolute;left:0;width:22vw;border-radius:3px;background:linear-gradient(90deg,transparent 0%,rgba(251,191,36,.0) 15%,rgba(251,191,36,.75) 60%,rgba(255,248,225,.95) 100%);transform:translateX(-30vw)}
        .fmc-gate.accel .fmc-gate-lines span{animation:fmcLineFly var(--dur) linear var(--del) infinite}
        .fmc-gate-vignette{position:absolute;inset:0;z-index:4;pointer-events:none;opacity:0;transition:opacity .5s ease;background:radial-gradient(75% 65% at 50% 48%,transparent 38%,rgba(5,4,3,.55) 78%,rgba(5,4,3,.9) 100%)}
        .fmc-gate.accel .fmc-gate-vignette{opacity:1}
        .fmc-gate-flash{position:absolute;inset:0;z-index:5;pointer-events:none;opacity:0;background:radial-gradient(ellipse 70% 55% at 50% 46%,rgba(255,247,220,.98) 0%,rgba(251,191,36,.5) 42%,transparent 75%)}
        .fmc-gate.accel .fmc-gate-content,.fmc-gate.accel .fmc-gate-top,.fmc-gate.accel .fmc-gate-cue{opacity:0;transform:translateY(18px);transition:opacity .35s ease,transform .45s cubic-bezier(.55,0,.85,.4)}
        .fmc-gate.leave{
          opacity:0;transform:scale(1.45);pointer-events:none;
          will-change:opacity,transform;
          transition:opacity .5s ease,transform .6s cubic-bezier(.55,0,.85,.4);
        }
        @keyframes fmcGateUp{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:none}}
        @keyframes fmcGateDown{from{opacity:0;transform:translateY(-14px)}to{opacity:1;transform:none}}
        @keyframes fmcPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.55;transform:scale(.8)}}
        @keyframes fmcCue{0%{transform:scaleY(.2);transform-origin:top;opacity:0}35%{transform:scaleY(1);opacity:1}100%{transform:scaleY(.2);transform-origin:bottom;opacity:0}}
        @keyframes fmcLineFly{from{transform:translateX(-30vw) scaleX(.4)}to{transform:translateX(118vw) scaleX(1.8)}}
        @media (prefers-reduced-motion: reduce){
          .fmc-gate-lines,.fmc-gate-vignette,.fmc-gate-flash{display:none}
          .fmc-gate-vid{transition:none}
          .fmc-gate.leave{transform:none;transition:opacity .3s ease}
        }
        @media (max-width:640px){.fmc-gate-cue{display:none}.fmc-gate-content{padding-bottom:44px}}
      `}</style>

      <video
        ref={vidRef}
        className="fmc-gate-vid"
        src={INTRO_VIDEOS[vidIdx]}
        autoPlay
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        onEnded={() => { if (phaseRef.current === "idle") setVidIdx((i) => (i + 1) % INTRO_VIDEOS.length); }}
      />
      <div className="fmc-gate-grade" aria-hidden="true" />
      <div className="fmc-gate-lines" aria-hidden="true">
        {SPEED_LINES.map((l, i) => (
          <span key={i} style={{ top: `${l.top}%`, height: `${l.h}px`, opacity: l.opa, "--dur": `${l.dur}s`, "--del": `${l.del}s` }} />
        ))}
      </div>
      <div className="fmc-gate-vignette" aria-hidden="true" />
      <div className="fmc-gate-flash" ref={flashRef} aria-hidden="true" />

      <div className="fmc-gate-top">
        <div className="fmc-gate-logo" aria-label="FindMyCar">
          <svg width="34" height="34" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="fmcGlg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fde047" /><stop offset="100%" stopColor="#d97706" />
              </linearGradient>
            </defs>
            <circle cx="24" cy="24" r="21" stroke="url(#fmcGlg)" strokeWidth="2.5" fill="rgba(251,191,36,0.06)" />
            <path d="M14 27c0-2 1.4-5.8 3-7.4 1-1 7-1.1 9.5-.6 1.8.4 4.3 2.5 5.5 3.5 2.4.5 4 1.5 4 3.3 0 1.2-.6 2.2-1.6 2.2" stroke="url(#fmcGlg)" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <circle cx="17.5" cy="30" r="2.6" fill="#fbbf24" />
            <circle cx="30.5" cy="30" r="2.6" fill="#fbbf24" opacity="0.7" />
          </svg>
          <span className="fmc-gate-logo-w">Find<em>My</em>Car</span>
        </div>
        <div className="fmc-gate-mkts"><b>PL</b>·<b>UA</b><span className="mkts-tail">—</span><span className="mkts-tail">{tr("2 живі ринки", "2 live markets")}</span></div>
      </div>

      <div className="fmc-gate-content">
        <div className="fmc-gate-badge"><span className="fmc-gate-pulse" aria-hidden="true" /> {tr("AI-радник з авто · без комісії", "AI car advisor · zero commission")}</div>
        <h1 className="fmc-gate-title">{tr(<>Європейський авторинок,<br /><em>зрозумілий для вас.</em></>, <>Europe&rsquo;s car market,<br /><em>decoded for you.</em></>)}</h1>
        <p className="fmc-gate-sub">{tr("FindMyCar — незалежний AI-радник, що шукає живі оголошення в Польщі та Україні й відповідає перед вами, а не перед дилерами.", "FindMyCar is an independent AI advisor that searches live listings across Poland and Ukraine — and answers to you, not to dealers.")}</p>
        <div className="fmc-gate-row">
          <button className="fmc-gate-cta" type="button" onClick={explore} autoFocus>
            {tr("Відкрити FindMyCar", "Explore FindMyCar")}
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>
          <div className="fmc-gate-hint"><i aria-hidden="true" /> {tr("Натисніть, щоб прискоритись", "Click to accelerate")}</div>
        </div>
      </div>

      <div className="fmc-gate-cue" aria-hidden="true">
        <span>{tr("Увійти", "Enter")}</span>
        <div className="fmc-gate-cue-line" />
      </div>
    </div>
  );
}
