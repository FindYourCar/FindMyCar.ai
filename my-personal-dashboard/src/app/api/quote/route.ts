import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return Response.json({ error: "Missing 'symbol' query parameter." }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`,
      {
        headers: { "User-Agent": "Mozilla/5.0" },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return Response.json({ error: `Quote lookup failed for ${symbol}.` }, { status: 502 });
    }

    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;

    if (!meta || typeof meta.regularMarketPrice !== "number") {
      return Response.json({ error: `No price data found for ${symbol}.` }, { status: 404 });
    }

    return Response.json({
      symbol,
      price: meta.regularMarketPrice as number,
      currency: (meta.currency as string) ?? "USD",
    });
  } catch {
    return Response.json({ error: `Failed to fetch quote for ${symbol}.` }, { status: 502 });
  }
}
