"use client";

import { useEffect, useRef, useState } from "react";

const PARTICLE_COUNT = 150;

/* ── Subtle starfield: ~150 white/gold particles drifting slowly ─────── */
function ParticleField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    let particles = [];

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function init() {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      particles = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.4 + 0.4,
        vx: (Math.random() - 0.5) * 0.08,
        vy: (Math.random() - 0.5) * 0.08,
        gold: Math.random() < 0.35,
        alpha: Math.random() * 0.5 + 0.2,
      }));
    }

    function draw() {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.gold
          ? `rgba(201, 168, 76, ${p.alpha})`
          : `rgba(255, 255, 255, ${p.alpha})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    }

    resize();
    init();
    draw();

    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}

/* ── Faint mesh/grid backdrop with a gentle mouse-driven parallax ─────── */
function MeshGrid() {
  const ref = useRef(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    let raf = null;
    function onMove(e) {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        if (ref.current) {
          ref.current.style.transform = `translate3d(${x * 12}px, ${y * 12}px, 0)`;
        }
        raf = null;
      });
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: "-20px",
        backgroundImage:
          "linear-gradient(rgba(201,168,76,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.06) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
        opacity: 0.5,
        transition: "transform 0.4s ease-out",
        maskImage: "radial-gradient(circle at center, black 0%, transparent 75%)",
        WebkitMaskImage: "radial-gradient(circle at center, black 0%, transparent 75%)",
        pointerEvents: "none",
      }}
    />
  );
}

const TRUST_STATS = ["50,000+ Listings", "4 Countries", "AI-Powered Search"];

export default function HeroSection() {
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    // Hook point: wire this into the existing search/chat flow if needed.
  }

  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        background: "#000000",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <MeshGrid />
      <ParticleField />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 880,
          margin: "0 auto",
          padding: "96px 24px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(2.4rem, 6vw, 4.2rem)",
            fontWeight: 800,
            color: "#ffffff",
            lineHeight: 1.15,
            margin: 0,
          }}
        >
          Find Your <span style={{ color: "#c9a84c" }}>Perfect</span> Car Across Europe
        </h1>

        <p
          style={{
            marginTop: 20,
            fontSize: "clamp(1rem, 2vw, 1.25rem)",
            color: "#9ca3af",
          }}
        >
          AI-powered search across Netherlands, Germany, Belgium and Poland
        </p>

        <form
          onSubmit={handleSubmit}
          role="search"
          style={{
            marginTop: 36,
            display: "flex",
            gap: 12,
            maxWidth: 640,
            margin: "36px auto 0",
            flexWrap: "wrap",
          }}
        >
          <label htmlFor="hero-search-input" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
            Search by make, model, or budget
          </label>
          <input
            id="hero-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search by make, model, or budget..."
            style={{
              flex: "1 1 320px",
              padding: "16px 20px",
              borderRadius: 12,
              border: "1px solid #c9a84c",
              background: "#0d0d0d",
              color: "#ffffff",
              fontSize: 16,
              outline: "none",
              boxShadow: searchFocused ? "0 0 0 3px rgba(201,168,76,0.35)" : "none",
              transition: "box-shadow 0.2s ease",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "16px 32px",
              borderRadius: 12,
              border: "1px solid #c9a84c",
              background: "#c9a84c",
              color: "#000000",
              fontWeight: 700,
              fontSize: 16,
              cursor: "pointer",
              transition: "opacity 0.2s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            Search
          </button>
        </form>

        <div
          style={{
            marginTop: 56,
            display: "flex",
            justifyContent: "center",
            gap: 40,
            flexWrap: "wrap",
          }}
        >
          {TRUST_STATS.map((stat) => (
            <div
              key={stat}
              style={{
                color: "#c9a84c",
                fontWeight: 700,
                fontSize: "clamp(0.95rem, 1.5vw, 1.1rem)",
              }}
            >
              {stat}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
