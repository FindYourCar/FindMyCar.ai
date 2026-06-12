"use client";

import React from "react";

// LuxCursor — a refined amber light source that follows the pointer.
// Three layers: bright core (tight follow), blurred glow (medium lag,
// velocity stretch), faint halo ring (slow lag). Expands over interactive
// elements, pulses on click, and paints a proximity spotlight on large cards
// via --fmc-mx/--fmc-my CSS variables.
//
// Desktop fine-pointers only; disabled on touch and prefers-reduced-motion.
// All layers are pointer-events:none and animate via a single rAF loop with
// direct transform writes — no React re-renders during movement.

const INTERACTIVE_SELECTOR = [
  "a", "button", "[role='button']", "input", "textarea", "select", "label",
  ".pill", ".bento-card", ".card-hover", ".step-card-hover", ".fmc-navbtn",
].join(",");

const SPOTLIGHT_SELECTOR = [
  ".bento-card", ".hiw-step", ".twy-stat", ".step-card-hover", ".shr-stage", ".mo-stat",
].join(",");

export default function LuxCursor() {
  const [enabled, setEnabled] = React.useState(false);
  const coreRef = React.useRef(null);
  const glowRef = React.useRef(null);
  const haloRef = React.useRef(null);

  React.useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)");
    const wide = window.matchMedia("(min-width: 1024px)");
    const motionOk = window.matchMedia("(prefers-reduced-motion: no-preference)");
    const update = () => setEnabled(fine.matches && wide.matches && motionOk.matches);
    update();
    [fine, wide, motionOk].forEach((m) => m.addEventListener("change", update));
    return () => [fine, wide, motionOk].forEach((m) => m.removeEventListener("change", update));
  }, []);

  React.useEffect(() => {
    if (!enabled) return;
    const core = coreRef.current, glow = glowRef.current, halo = haloRef.current;
    if (!core || !glow || !halo) return;

    document.documentElement.classList.add("fmc-cursor-on");

    const pos = { x: innerWidth / 2, y: innerHeight / 2 };
    const c = { x: pos.x, y: pos.y };
    const g = { x: pos.x, y: pos.y };
    const h = { x: pos.x, y: pos.y };
    let hovering = false;
    let pressed = false;
    let visible = false;
    let raf = null;
    let idleFrames = 0;
    let spotEl = null;

    const loop = () => {
      // Ease each layer toward the pointer at its own rate
      c.x += (pos.x - c.x) * 0.55; c.y += (pos.y - c.y) * 0.55;
      g.x += (pos.x - g.x) * 0.22; g.y += (pos.y - g.y) * 0.22;
      h.x += (pos.x - h.x) * 0.10; h.y += (pos.y - h.y) * 0.10;

      // Velocity-based stretch on the glow (subtle, clamped)
      const vx = pos.x - g.x, vy = pos.y - g.y;
      const speed = Math.hypot(vx, vy);
      const stretch = Math.min(1 + speed / 260, 1.22);
      const angle = Math.atan2(vy, vx);

      const coreScale = pressed ? 0.72 : hovering ? 0.85 : 1;
      const haloScale = pressed ? 0.92 : hovering ? 1.4 : 1;

      core.style.transform = `translate3d(${c.x}px,${c.y}px,0) translate(-50%,-50%) scale(${coreScale})`;
      glow.style.transform = `translate3d(${g.x}px,${g.y}px,0) translate(-50%,-50%) rotate(${angle}rad) scale(${stretch},${2 - stretch})`;
      halo.style.transform = `translate3d(${h.x}px,${h.y}px,0) translate(-50%,-50%) scale(${haloScale})`;

      // Park the loop once everything has settled
      idleFrames = speed < 0.1 && Math.hypot(pos.x - c.x, pos.y - c.y) < 0.1 ? idleFrames + 1 : 0;
      raf = idleFrames > 30 ? null : requestAnimationFrame(loop);
    };
    const wake = () => { if (raf === null) { idleFrames = 0; raf = requestAnimationFrame(loop); } };

    const onMove = (e) => {
      pos.x = e.clientX; pos.y = e.clientY;
      if (!visible) {
        visible = true;
        c.x = g.x = h.x = pos.x; c.y = g.y = h.y = pos.y;
        // Paint immediately so the cursor appears even before the rAF loop ticks
        const t = `translate3d(${pos.x}px,${pos.y}px,0) translate(-50%,-50%)`;
        core.style.transform = t; glow.style.transform = t; halo.style.transform = t;
        [core, glow, halo].forEach((el) => { el.style.opacity = "1"; });
      }
      // Proximity spotlight on large cards
      const spot = e.target.closest?.(SPOTLIGHT_SELECTOR) || null;
      if (spot !== spotEl) {
        spotEl?.classList.remove("fmc-spot-on");
        spotEl = spot;
        spotEl?.classList.add("fmc-spot-on");
      }
      if (spotEl) {
        const r = spotEl.getBoundingClientRect();
        spotEl.style.setProperty("--fmc-mx", `${(((e.clientX - r.left) / r.width) * 100).toFixed(2)}%`);
        spotEl.style.setProperty("--fmc-my", `${(((e.clientY - r.top) / r.height) * 100).toFixed(2)}%`);
      }
      wake();
    };
    const onOver = (e) => { hovering = !!e.target.closest?.(INTERACTIVE_SELECTOR); wake(); };
    const onDown = () => {
      pressed = true;
      // Soft expanding ring pulse from the click point
      halo.animate(
        [
          { boxShadow: "0 0 0 0 rgba(251,191,36,0.35), inset 0 0 18px rgba(251,191,36,0.10)" },
          { boxShadow: "0 0 0 26px rgba(251,191,36,0), inset 0 0 18px rgba(251,191,36,0.10)" },
        ],
        { duration: 520, easing: "cubic-bezier(.2,.8,.2,1)" }
      );
      wake();
    };
    const onUp = () => { pressed = false; wake(); };
    const onLeave = () => {
      visible = false;
      [core, glow, halo].forEach((el) => { el.style.opacity = "0"; });
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    document.documentElement.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(loop);

    return () => {
      document.documentElement.classList.remove("fmc-cursor-on");
      spotEl?.classList.remove("fmc-spot-on");
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <style>{`
        html.fmc-cursor-on, html.fmc-cursor-on body,
        html.fmc-cursor-on a, html.fmc-cursor-on button,
        html.fmc-cursor-on [role='button'], html.fmc-cursor-on select,
        html.fmc-cursor-on label{cursor:none}
        html.fmc-cursor-on input[type='text'], html.fmc-cursor-on input[type='email'],
        html.fmc-cursor-on input[type='password'], html.fmc-cursor-on input[type='number'],
        html.fmc-cursor-on input[type='search'], html.fmc-cursor-on textarea{cursor:text}
        .fmc-cur{position:fixed;top:0;left:0;pointer-events:none;opacity:0;will-change:transform;transition:opacity .3s ease}
        .fmc-cur-core{z-index:602;width:6px;height:6px;border-radius:50%;
          background:#ffe9a8;box-shadow:0 0 6px rgba(255,233,168,.9),0 0 14px rgba(251,191,36,.55)}
        .fmc-cur-glow{z-index:601;width:30px;height:30px;border-radius:50%;
          background:radial-gradient(circle,rgba(251,191,36,.32) 0%,rgba(217,119,6,.12) 55%,transparent 75%);
          filter:blur(6px)}
        .fmc-cur-halo{z-index:600;width:64px;height:64px;border-radius:50%;
          border:1px solid rgba(251,191,36,.18);
          background:radial-gradient(circle,transparent 55%,rgba(251,191,36,.05) 78%,transparent 100%);
          box-shadow:inset 0 0 18px rgba(251,191,36,.10);
          transition:opacity .3s ease,border-color .35s ease}
      `}</style>
      <div ref={coreRef} className="fmc-cur fmc-cur-core" aria-hidden="true" />
      <div ref={glowRef} className="fmc-cur fmc-cur-glow" aria-hidden="true" />
      <div ref={haloRef} className="fmc-cur fmc-cur-halo" aria-hidden="true" />
    </>
  );
}
