import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the workspace root: a stray lockfile in the user home directory
  // otherwise makes Turbopack resolve the app from the wrong folder (404s).
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
