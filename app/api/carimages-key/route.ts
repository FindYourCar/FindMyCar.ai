// GET /api/carimages-key
// Returns the CarImages publishable client key, read from the environment at
// REQUEST time (not build time). This is the fix for the Vercel prod issue:
// NEXT_PUBLIC_* vars are inlined during `next build`, so if the key isn't present
// in that specific build (wrong env scope, or a cache-reused redeploy) it silently
// becomes undefined and the loader never runs. Reading it here — in a dynamic
// route handler — means the running deployment's env is used, so setting the var
// in Vercel + redeploying always takes effect.
//
// The key is a publishable client identifier (it already rides in the image URL
// the browser requests), so exposing it here is no different from the intended
// NEXT_PUBLIC_ usage.

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  // Read the NON-public var FIRST. Next.js inlines every `process.env.NEXT_PUBLIC_*`
  // reference at BUILD time — even here in a server route — so a NEXT_PUBLIC read is
  // frozen to the build's value and can never reflect the runtime environment. A
  // plain (non-public) var is left as a real `process.env` lookup and is read at
  // request time, so it survives a build that didn't have the key. `||` (not `??`)
  // so an inlined empty string still falls through.
  const key =
    process.env.CARIMAGES_API_KEY ||
    process.env.NEXT_PUBLIC_CARIMAGES_API_KEY ||
    "";
  return NextResponse.json(
    { enabled: Boolean(key), key },
    { headers: { "Cache-Control": "no-store" } },
  );
}
