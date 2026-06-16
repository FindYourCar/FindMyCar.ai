"use client";

import React from "react";

// Hands-free demo driver for recording a walkthrough video.
// Activates ONLY when the URL has ?tour=1 (or ?tour) — normal visitors never
// see it. It plays the cinematic intro, auto-clicks "Explore", then runs a
// smooth, timed tour through every section (with a live chat search and the
// cost calculator), then returns to the top. Press record, load ?tour=1, done.
//
// A faint "REC" pill + progress bar shows while the tour runs so you can trim
// cleanly; both are hidden from normal users.

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

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

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

    (async () => {
      // ── Phase 0: let the cinematic intro breathe ──────────────
      setProgress(0.04);
      const cta = await waitFor(".fmc-gate-cta", 6000);
      await sleep(4200);
      if (guard()) return;

      // ── Phase 1: Explore → acceleration transition ────────────
      if (cta) cta.click();
      await sleep(1800);
      if (guard()) return;
      setProgress(0.12);

      // ── Phase 2: hero + advisor chat (live search) ────────────
      scrollToId("home-top");
      await sleep(2600);
      if (guard()) return;

      const ta = document.querySelector("textarea");
      if (ta) {
        ta.focus();
        const query = "Show me a Mercedes CLE with max 50,000 km in Belgium";
        // Type it out so the recording shows real input
        for (let i = 1; i <= query.length && !guard(); i++) {
          setNativeValue(ta, query.slice(0, i));
          await sleep(22);
        }
        await sleep(500);
        const sendBtn = document.querySelector("button.btn-primary.shrink-0");
        if (sendBtn && !sendBtn.disabled) sendBtn.click();
        else ta.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
        // Wait for the live-market card to render
        await waitFor(".lmc", 9000);
        await sleep(3200);
      }
      if (guard()) return;
      setProgress(0.3);

      // ── Phase 3: markets bento (+ open one overlay) ───────────
      scrollToId("home-markets");
      await sleep(2400);
      const firstCard = document.querySelector("#home-markets .bento-card");
      if (firstCard) {
        firstCard.click();
        await sleep(3000);
        document.querySelector(".mo-close")?.click();
        await sleep(900);
      }
      if (guard()) return;
      setProgress(0.45);

      // ── Phase 4: cost calculator (fill + calculate) ───────────
      scrollToId("home-calculator");
      await sleep(2200);
      const calcInputs = document.querySelectorAll("#home-calculator .calc-input-wrap input");
      if (calcInputs.length >= 2) {
        setNativeValue(calcInputs[0], "24000");
        await sleep(500);
        setNativeValue(calcInputs[1], "15000");
        await sleep(500);
        document.querySelector("#home-calculator .calc-btn-go")?.click();
        await sleep(3200);
      }
      if (guard()) return;
      setProgress(0.6);

      // ── Phase 5: how it works ─────────────────────────────────
      scrollToId("home-how");
      await sleep(3000);
      if (guard()) return;
      setProgress(0.72);

      // ── Phase 6: 3D showroom (let it rotate) ──────────────────
      scrollToId("home-showroom");
      await sleep(5000);
      if (guard()) return;
      setProgress(0.84);

      // ── Phase 7: why us / trust ───────────────────────────────
      scrollToId("home-why");
      await sleep(3000);
      if (guard()) return;
      setProgress(0.92);

      // ── Phase 8: FAQ + footer ─────────────────────────────────
      scrollToId("home-faq");
      await sleep(2600);
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      await sleep(2600);
      if (guard()) return;
      setProgress(0.98);

      // ── Close: glide back to the top ──────────────────────────
      window.scrollTo({ top: 0, behavior: "smooth" });
      await sleep(1600);
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
