"use client";

import React from "react";

// Hands-free demo driver for recording a walkthrough video.
// Activates ONLY when the URL has ?tour=1 (or ?tour) — normal visitors never
// see it. It plays the cinematic intro, auto-clicks "Explore", runs a scripted
// advisor exchange (deterministic, ends by offering listings — no real listings
// shown), then glides through every section, scrolling each one fully into view
// (incl. the market overlay and the calculator results) before moving on.
//
// A faint "REC" pill + top progress bar shows while it runs so the take is easy
// to trim. Both are hidden from normal users.

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function waitFor(selector, timeout = 8000) {
  return new Promise((resolve) => {
    const found = document.querySelector(selector);
    if (found) return resolve(found);
    const t0 = Date.now();
    const iv = setInterval(() => {
      const el = document.querySelector(selector);
      if (el || Date.now() - t0 > timeout) { clearInterval(iv); resolve(el || null); }
    }, 120);
  });
}

function setNativeValue(el, value) {
  const proto = el.tagName === "TEXTAREA" ? window.HTMLTextAreaElement : window.HTMLInputElement;
  const setter = Object.getOwnPropertyDescriptor(proto.prototype, "value").set;
  setter.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

const USER_MSG =
  "Hey! 👋 I need a reliable family car, budget around €25k, mostly city with the odd weekend trip — which model would you suggest? 🙂";
const ADVISOR_REPLY =
  "Great brief — that actually narrows things down nicely 🙂\n\n" +
  "For ~€25k, family use, mostly city plus weekend getaways, I'd steer you toward a Toyota Corolla Touring Sports Hybrid 🚗 — properly roomy, famously reliable, and the hybrid keeps city running costs low. Two strong alternatives: a Škoda Octavia 🧳 (huge boot, superb value) or a Honda Civic e:HEV ⚡ for a bit more polish.\n\n" +
  "Want me to pull up some live listings for one of these? 🔎";

export default function TourMode() {
  const [active, setActive] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    let params;
    try { params = new URLSearchParams(window.location.search); } catch { return; }
    if (!params.has("tour")) return;
    setActive(true);

    let cancelled = false;
    const guard = () => cancelled;

    // Scroll a section to the top, dwell, then — if it is taller than the
    // viewport — reveal its lower half so the whole section is shown.
    async function showSection(id, topMs = 2400, revealMs = 2800) {
      const el = document.getElementById(id);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      await sleep(topMs);
      if (guard()) return;
      const r = el.getBoundingClientRect();
      if (r.height > window.innerHeight + 60) {
        const top = r.bottom + window.scrollY - window.innerHeight + 28;
        window.scrollTo({ top, behavior: "smooth" });
        await sleep(revealMs);
      }
    }

    (async () => {
      // ── Phase 0: let the cinematic intro breathe ──────────────
      setProgress(0.04);
      const cta = await waitFor(".fmc-gate-cta", 6000);
      await sleep(4200);
      if (guard()) return;

      // ── Phase 1: Explore → acceleration transition ────────────
      if (cta) cta.click();
      await sleep(1900);
      if (guard()) return;
      setProgress(0.12);

      // ── Phase 2: advisor chat (scripted, deterministic) ───────
      const hook = window.__fmcTourChat;
      hook?.reset();   // clear any persisted history so the take is clean
      await sleep(300);
      document.getElementById("home-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
      await sleep(2000);
      const ta = document.querySelector("textarea");
      if (ta && hook) {
        ta.focus();
        for (let i = 1; i <= USER_MSG.length && !guard(); i++) {
          setNativeValue(ta, USER_MSG.slice(0, i));
          await sleep(16);
        }
        await sleep(550);
        setNativeValue(ta, "");        // clear the box as if sent
        hook.user(USER_MSG);
        await sleep(750);
        hook.typing(true);
        await sleep(1700);
        if (guard()) return;
        hook.typing(false);
        hook.assistant(ADVISOR_REPLY);
        await sleep(5200);             // dwell so the reply is readable
      }
      if (guard()) return;
      setProgress(0.3);

      // ── Phase 3: markets bento + full market overlay ──────────
      document.getElementById("home-markets")?.scrollIntoView({ behavior: "smooth", block: "start" });
      await sleep(2400);
      const firstCard = document.querySelector("#home-markets .bento-card");
      if (firstCard) {
        firstCard.click();
        await sleep(1600);
        const ov = document.querySelector(".mkt-overlay");
        if (ov) {
          ov.scrollTo({ top: ov.scrollHeight, behavior: "smooth" }); // reveal full market detail
          await sleep(4200);
          ov.scrollTo({ top: 0, behavior: "smooth" });
          await sleep(1500);
        }
        document.querySelector(".mo-close")?.click();
        await sleep(1000);
      }
      if (guard()) return;
      setProgress(0.46);

      // ── Phase 4: cost calculator (fill, calculate, show results) ─
      document.getElementById("home-calculator")?.scrollIntoView({ behavior: "smooth", block: "start" });
      await sleep(2200);
      const calcInputs = document.querySelectorAll("#home-calculator .calc-input-wrap input");
      if (calcInputs.length >= 2) {
        setNativeValue(calcInputs[0], "24000");
        await sleep(500);
        setNativeValue(calcInputs[1], "15000");
        await sleep(500);
        document.querySelector("#home-calculator .calc-btn-go")?.click();
        await sleep(1400);
        // reveal the results panel fully
        const calc = document.getElementById("home-calculator");
        if (calc) {
          const r = calc.getBoundingClientRect();
          window.scrollTo({ top: r.bottom + window.scrollY - window.innerHeight + 28, behavior: "smooth" });
          await sleep(3400);
        }
      }
      if (guard()) return;
      setProgress(0.62);

      // ── Phase 5: how it works ─────────────────────────────────
      await showSection("home-how", 2800, 2600);
      if (guard()) return;
      setProgress(0.74);

      // ── Phase 6: 3D showroom (let it rotate) ──────────────────
      document.getElementById("home-showroom")?.scrollIntoView({ behavior: "smooth", block: "start" });
      await sleep(5200);
      if (guard()) return;
      setProgress(0.85);

      // ── Phase 7: why us / trust ───────────────────────────────
      await showSection("home-why", 2600, 2400);
      if (guard()) return;
      setProgress(0.93);

      // ── Phase 8: FAQ + footer ─────────────────────────────────
      await showSection("home-faq", 2400, 2200);
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      await sleep(2600);
      if (guard()) return;
      setProgress(0.98);

      // ── Close: glide back to the top ──────────────────────────
      window.scrollTo({ top: 0, behavior: "smooth" });
      await sleep(1700);
      setProgress(1);
      await sleep(1200);
      if (!guard()) setActive(false);
    })();

    return () => { cancelled = true; };
  }, []);

  if (!active) return null;

  return (
    <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 500, pointerEvents: "none" }}>
      <style>{`
        .tour-rec{position:fixed;top:18px;right:18px;display:flex;align-items:center;gap:8px;background:rgba(10,9,8,.6);border:1px solid rgba(255,255,255,.1);border-radius:999px;padding:6px 12px;font-family:ui-monospace,monospace;font-size:11px;letter-spacing:.14em;color:#cdc6bc;backdrop-filter:blur(8px)}
        .tour-rec i{width:8px;height:8px;border-radius:50%;background:#f87171;box-shadow:0 0 8px rgba(248,113,113,.8);animation:tourBlink 1.1s ease-in-out infinite}
        .tour-bar{position:fixed;left:0;top:0;height:2px;background:linear-gradient(90deg,#fbbf24,#d97706);box-shadow:0 0 10px rgba(251,191,36,.6);transition:width .6s ease}
        @keyframes tourBlink{0%,100%{opacity:1}50%{opacity:.25}}
      `}</style>
      <div className="tour-bar" style={{ width: `${Math.round(progress * 100)}%` }} />
      <div className="tour-rec"><i />TOUR</div>
    </div>
  );
}
