import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the workspace root: a stray lockfile in the user home directory
  // otherwise makes Turbopack infer the wrong root, which 404s the API routes
  // (/api/market-search etc.) in local dev. No effect on Vercel's clean build.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
