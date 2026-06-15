import { NextRequest } from "next/server";
import OpenAI from "openai";
import {
  AI_ADVISOR_SYSTEM_PROMPT,
  FinancialSnapshot,
  formatFinancialContextMessage,
} from "@/lib/aiAdvisor";

export const runtime = "nodejs";

interface ChatRequestBody {
  messages: { role: "user" | "assistant"; content: string }[];
  financialContext: FinancialSnapshot;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "OPENAI_API_KEY is not configured on the server." }, { status: 500 });
  }

  let body: ChatRequestBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { messages, financialContext } = body;
  if (!Array.isArray(messages) || !financialContext) {
    return Response.json({ error: "Request must include 'messages' and 'financialContext'." }, { status: 400 });
  }

  const client = new OpenAI({ apiKey });

  try {
    const stream = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: AI_ADVISOR_SYSTEM_PROMPT },
        { role: "system", content: formatFinancialContextMessage(financialContext) },
        ...messages,
      ],
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content ?? "";
            if (delta) controller.enqueue(encoder.encode(delta));
          }
        } catch (err) {
          controller.error(err);
          return;
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to reach OpenAI.";
    return Response.json({ error: message }, { status: 502 });
  }
}
