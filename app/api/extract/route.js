// Keep in sync with app/api/chat/route.js — Groq retires model IDs, so we try a
// list and remember the first that works instead of hardcoding one dead model.
const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "openai/gpt-oss-120b",
  "moonshotai/kimi-k2-instruct",
  "qwen/qwen3-32b",
  "llama-3.1-8b-instant",
];
let cachedGroqModel = null;

async function groqComplete(payload) {
  const ordered = cachedGroqModel
    ? [cachedGroqModel, ...GROQ_MODELS.filter((m) => m !== cachedGroqModel)]
    : GROQ_MODELS;
  let lastStatus = 0;
  for (const model of ordered) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({ ...payload, model }),
    });
    if (res.ok) {
      cachedGroqModel = model;
      return res.json();
    }
    lastStatus = res.status;
    const data = await res.json().catch(() => ({}));
    const msg = data?.error?.message || "";
    if (!/model|decommission|does not exist|not found|access/i.test(msg)) break;
  }
  throw new Error(`Groq ${lastStatus}`);
}

export async function POST(req) {
  try {
    const { query, context } = await req.json();
    if (!query) return new Response(JSON.stringify({ error: "No query" }), { status: 400 });

    // Recent conversation (optional) so the model can resolve references like
    // "yes please", "show me listings", or "the first one" to the car already
    // under discussion, and judge whether the user wants to see actual cars.
    const contextMsgs = Array.isArray(context)
      ? context
          .filter((m) => m && typeof m.content === "string" && m.content.trim())
          .slice(-6)
          .map((m) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content.slice(0, 500),
          }))
      : [];

    const data = await groqComplete({
      temperature: 0,
      max_tokens: 300,
      messages: [
          {
            role: "system",
            content: `You classify a car shopper's LATEST message and extract search intent. Output ONLY valid JSON — no prose, no markdown fences, nothing else.

Schema:
{
  "intent": "listing" | "advice" | "recommendation" | "chitchat",
  "wantsListings": boolean,
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

INTENT + wantsListings — decide from the LATEST user message, using the conversation for context:
- "listing" (wantsListings = true): the user wants to SEE actual cars / listings / offers / deals / prices for a specific make or model. Includes: naming a make or model as something to look at ("golf gti", "show me a Touareg", "Audi A4 under 20k"), asking for the "best deal / cheapest / best listing / top offers" for a model, or AGREEING to your offer to show options ("yes", "yes please", "sure", "show me"). Requires a make or model that is resolvable from the message OR from the conversation context.
- "recommendation" (wantsListings = false): broad "what should I buy / best car / best SUV / best family car" questions with no single specific model yet — this is advice, not a listing.
- "advice" (wantsListings = false): opinions, reliability, running costs, specs, "is the Golf good", comparisons ("X vs Y").
- "chitchat" (wantsListings = false): greetings, small talk, off-topic, thanks.

REFERENCE RESOLUTION (critical):
- If the latest message does NOT name a car but refers to one already discussed (e.g. "yes please", "show me the listings", "that one", "the first"), set make/model from the most recently discussed car in the context.
- If the user affirms right after you offered to show options/listings, set wantsListings = true and fill make/model from context.

EXTRACTION rules:
- Use broad car knowledge to identify the brand and model FAMILY for ANY make (mainstream or niche). NEVER output a URL, link, slug, or path — only the fields below.
- make: canonical brand name only (e.g. "Mercedes-Benz", "BMW", "Volkswagen", "Alfa Romeo", "Lexus", "Opel"). Always "Mercedes-Benz" with a hyphen, never a space.
- model: the model FAMILY plus a genuine performance variant when named (e.g. "Golf GTI", "Golf R", "A4"), but NO body words (Avant, Touring, Variant, Estate, Sportback), NO plain engine badges (320d, c220d), NO filter words. Examples: "3 Series" (not "320d Touring"), "C-Class", "Giulia", "MX-5", "RAV4".
- budget_max / mileage_max / year_min: plain numbers only, never strings. A 4-digit year is a year, never a budget.
- confidence: 0.0 = vague/no make, 0.5 = make known, 0.8 = make + model, 1.0 = fully specific.`,
          },
        ...contextMsgs,
        { role: "user", content: `Classify and extract intent from this latest message: "${query}"` },
      ],
    });

    const content = data?.choices?.[0]?.message?.content || "";
    // Extract the JSON object even if the model wrapped it in prose
    const match = content.match(/\{[\s\S]*\}/);
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
