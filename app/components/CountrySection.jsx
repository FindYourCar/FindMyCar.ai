"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// 3D canvas is loaded client-side only, and only once a card scrolls into view.
const CountryCarCanvas = dynamic(() => import("./CountryCarCanvas"), {
  ssr: false,
  loading: () => <CarSpinner />,
});

const COUNTRIES = [
  {
    flag: "🇳🇱",
    name: "Netherlands",
    description: "Smart. Compact. EV-Ready.",
    popular: "Tesla Model 3",
    avgPrice: "€28,500",
  },
  {
    flag: "🇩🇪",
    name: "Germany",
    description: "Premium. Engineered. Precise.",
    popular: "BMW 3 Series",
    avgPrice: "€35,000",
  },
  {
    flag: "🇧🇪",
    name: "Belgium",
    description: "Practical. Family. Reliable.",
    popular: "Volkswagen Passat",
    avgPrice: "€24,000",
  },
  {
    flag: "🇵🇱",
    name: "Poland",
    description: "Value. Import. Smart Buy.",
    popular: "Skoda Octavia",
    avgPrice: "€18,500",
  },
];

function CarSpinner() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: 160,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div className="country-car-spinner" aria-label="Loading 3D model" role="status" />
    </div>
  );
}

function CountryCard({ country }) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    // Lazy-load the 3D canvas only once the card scrolls near the viewport.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={cardRef} className="country-card">
      <div className="country-card-text">
        <div className="country-card-title">
          <span className="country-card-flag">{country.flag}</span>
          {country.name}
        </div>
        <p className="country-card-desc">{country.description}</p>
        <p className="country-card-popular">Most Popular: {country.popular}</p>
        <p className="country-card-price">Avg Price: {country.avgPrice}</p>
        <button type="button" className="country-card-cta">
          Browse Listings
        </button>
      </div>
      <div className="country-card-canvas">
        {isVisible ? (
          <Suspense fallback={<CarSpinner />}>
            <CountryCarCanvas />
          </Suspense>
        ) : (
          <CarSpinner />
        )}
      </div>
    </div>
  );
}

export default function CountrySection() {
  return (
    <section style={{ background: "#000000", padding: "80px 24px" }}>
      <div className="country-grid">
        {COUNTRIES.map((country) => (
          <CountryCard key={country.name} country={country} />
        ))}
      </div>

      <style>{`
        .country-grid {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        .country-card {
          display: flex;
          flex-direction: row;
          align-items: stretch;
          gap: 16px;
          background: #0d0d0d;
          border: 1px solid rgba(201, 168, 76, 0.25);
          border-radius: 16px;
          padding: 24px;
          min-height: 220px;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }

        .country-card:hover {
          border-color: rgba(201, 168, 76, 0.7);
          box-shadow: 0 0 32px rgba(201, 168, 76, 0.25);
        }

        .country-card-text {
          flex: 1 1 55%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 10px;
          min-width: 0;
        }

        .country-card-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 28px;
          font-weight: 700;
          color: #ffffff;
        }

        .country-card-flag {
          font-size: 32px;
          line-height: 1;
        }

        .country-card-desc {
          margin: 0;
          color: #9ca3af;
          font-size: 15px;
        }

        .country-card-popular {
          margin: 0;
          color: #c9a84c;
          font-size: 15px;
          font-weight: 600;
        }

        .country-card-price {
          margin: 0;
          color: #ffffff;
          font-size: 15px;
        }

        .country-card-cta {
          margin-top: 8px;
          align-self: flex-start;
          padding: 10px 22px;
          min-height: 44px;
          border-radius: 999px;
          border: 1px solid #c9a84c;
          background: transparent;
          color: #c9a84c;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.25s ease, color 0.25s ease;
        }

        .country-card-cta:hover,
        .country-card-cta:focus-visible {
          background: #c9a84c;
          color: #000000;
        }

        .country-card-canvas {
          flex: 1 1 45%;
          min-height: 180px;
          position: relative;
        }

        .country-car-spinner {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 3px solid rgba(201, 168, 76, 0.2);
          border-top-color: #c9a84c;
          animation: country-car-spin 0.9s linear infinite;
        }

        @keyframes country-car-spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .country-grid {
            grid-template-columns: 1fr;
          }
          .country-card {
            flex-direction: column;
          }
          .country-card-canvas {
            min-height: 220px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .country-car-spinner {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
