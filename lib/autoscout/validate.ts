// Server-side link validation. Confirms a built AutoScout24 URL doesn't resolve
// to a dead page before we present it as a real result.
//
// Outcomes:
//   "ok"           → HTTP 200 (verified live)
//   "dead"         → HTTP 404/410 OR a known not-found body signature → caller must degrade
//   "inconclusive" → blocked/timeout/other (bot wall, 403, network) → trust the
//                    registry-built URL but don't claim verification
//
// We never treat "inconclusive" as "dead": AutoScout aggressively bot-walls
// server requests, and falsely degrading every link would be worse UX.

export type ValidationState = "ok" | "dead" | "inconclusive";

const DEAD_BODY_SIGNATURES = [
  "bestaat helaas niet meer",          // NL: page no longer exists
  "n'existe malheureusement plus",     // FR
  "existiert leider nicht mehr",       // DE
  "no longer exists",                  // EN
  "page not found",
  "404 - ",
];

export async function validateAutoscoutUrl(url: string, timeoutMs = 4000): Promise<ValidationState> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        // A real UA reduces (not eliminates) bot-walling.
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en,nl;q=0.8",
      },
    });

    if (res.status === 404 || res.status === 410) return "dead";
    if (!res.ok) return "inconclusive"; // 403/429/5xx → can't confirm dead

    // Some not-found pages return 200 with a soft-404 body — scan a slice.
    const body = (await res.text()).slice(0, 60000).toLowerCase();
    if (DEAD_BODY_SIGNATURES.some((sig) => body.includes(sig))) return "dead";
    return "ok";
  } catch {
    return "inconclusive"; // abort/timeout/network
  } finally {
    clearTimeout(timer);
  }
}
