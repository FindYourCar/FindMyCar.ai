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
- make: canonical brand name only (e.g. "Mercedes-Benz", "BMW", "Volkswagen"). Never write "Mercedes Benz" with a space — always "Mercedes-Benz".
- model: specific model only, NO make words, NO filter words (e.g. "C-Class", "A4", "306", "320d Touring", "Avant"). Never include words like "only", "please", "petrol", "under".
- budget_max / mileage_max / year_min: plain numbers only, never strings.
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
