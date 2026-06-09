"use client";

import dynamic from "next/dynamic";

// Dynamically imported with ssr:false inside a Client Component — required by Next.js App Router
const Hero3DCanvas = dynamic(() => import("./Hero3DCanvas"), { ssr: false });

export default function Hero3DCanvasLoader() {
  return <Hero3DCanvas />;
}
