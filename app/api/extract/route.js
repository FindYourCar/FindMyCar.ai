export async function POST(req) {
  try {
    const { query } = await req.json();
    if (!query) return new Response(JSON.stringify({ error: "No query" }), { status: 400 });

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0,
        max_tokens: 300,
        messages: [
          {
            role: "system",
            content: `You extract car search intent from user queries. Output ONLY valid JSON — no prose, no markdown fences, nothing else.

Schema:
{
  "make": string | null,
  "model": string | null,
  "fuel_type": "petrol" | "diesel" | "hybrid" | "plug_in_hybrid" | "electric" | null,
  "transmission": "manual" | "automatic" | null,
  "budget_max": number | null,
  "mileage_max": number | null,
  "year_min": number | null,
  "country": "NL" | "BE" | "DE" | "PL" | null,
  "confidence": number
}

Rules:
- Use your broad car knowledge to identify the brand and model FAMILY for ANY make in the market (mainstream or niche), then output structured fields only. NEVER output a URL, link, slug, or path — only the fields below.
- make: canonical brand name only (e.g. "Mercedes-Benz", "BMW", "Volkswagen", "Alfa Romeo", "Lexus", "Opel"). Never write "Mercedes Benz" with a space — always "Mercedes-Benz".
- model: the model FAMILY name in its normal written form, with NO make words, NO trim/engine/body words, NO filter words. Examples: "3 Series" (not "320d Touring"), "A4" (not "A4 Avant"), "C-Class", "Giulia", "MX-5", "RAV4", "Superb", "Insignia", "IS", "Stinger". Drop badges (320d, c220d), bodies (Avant, Touring, Variant, Estate, Sportback) and trims (AMG, Quadrifoglio, Competizione).
- budget_max / mileage_max / year_min: plain numbers only, never strings. A 4-digit year is a year, never a budget.
- confidence: 0.0 = vague/no make, 0.5 = make known, 0.8 = make + model, 1.0 = fully specific.`,
          },
          { role: "user", content: `Extract intent from: "${query}"` },
        ],
      }),
    });

    if (!res.ok) throw new Error(`Groq ${res.status}`);

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || "";
    // Extract the JSON object even if the model wrapped it in prose
    const match = content.match(/\{[\s\S]*?\}/);
    if (!match) throw new Error("No JSON in LLM response");

    const intent = JSON.parse(match[0]);
    return new Response(JSON.stringify({ intent, source: "llm" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
