"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, User } from "lucide-react";
import { uid } from "@/lib/utils";
import { CFO_WELCOME_MESSAGE, ChatContext } from "@/lib/cfoChat";
import { AI_QUICK_ACTIONS, buildFinancialSnapshot } from "@/lib/aiAdvisor";

interface ChatMessage {
  id: string;
  role: "user" | "cfo";
  text: string;
}

type CfoChatProps = Omit<ChatContext, "now">;

export default function CfoChat(props: CfoChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "cfo", text: CFO_WELCOME_MESSAGE },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMessage: ChatMessage = { id: uid(), role: "user", text: trimmed };
    const history = [...messages, userMessage].map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("assistant" as const),
      content: m.text,
    }));

    const assistantId = uid();
    setMessages((prev) => [...prev, userMessage, { id: assistantId, role: "cfo", text: "" }]);
    setInput("");
    setLoading(true);

    const snapshot = buildFinancialSnapshot(props.transactions, props.profile, props.currency, new Date());

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, financialContext: snapshot }),
      });

      if (!res.ok || !res.body) {
        let errorMessage = "Something went wrong talking to the AI advisor.";
        try {
          const data = await res.json();
          if (data?.error) errorMessage = data.error;
        } catch {
          // ignore JSON parse failure, use default message
        }
        throw new Error(errorMessage);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, text: full } : m)));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error.";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, text: `Sorry, I couldn't reach the AI advisor right now (${message}). Try again in a moment.` }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <div className="bg-surface border border-[#d4af37]/30 rounded-2xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#d4af37]/15 text-[#d4af37] flex items-center justify-center shrink-0">
          <Bot size={20} />
        </div>
        <div>
          <h2 className="font-semibold">CFO Assistant</h2>
          <p className="text-xs text-gray-500">Your AI investment advisor — ask me anything about your finances</p>
        </div>
      </div>

      {/* Message history */}
      <div
        ref={scrollRef}
        className="flex flex-col gap-3 max-h-[26rem] overflow-y-auto pr-1 scroll-smooth"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "cfo" && (
              <div className="w-7 h-7 rounded-lg bg-[#d4af37]/15 text-[#d4af37] flex items-center justify-center shrink-0 mt-0.5">
                <Bot size={14} />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line leading-relaxed ${
                m.role === "user"
                  ? "bg-[#d4af37] text-black rounded-br-sm font-medium"
                  : "bg-[#1c1c1c] border border-border text-gray-200 rounded-bl-sm"
              }`}
            >
              {m.text.length > 0 ? (
                m.text
              ) : (
                <span className="inline-flex items-center gap-1 text-gray-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse [animation-delay:0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse [animation-delay:0.3s]" />
                </span>
              )}
            </div>
            {m.role === "user" && (
              <div className="w-7 h-7 rounded-lg bg-[#1c1c1c] border border-border text-[#d4af37] flex items-center justify-center shrink-0 mt-0.5">
                <User size={14} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        {AI_QUICK_ACTIONS.map((reply) => (
          <button
            key={reply}
            type="button"
            disabled={loading}
            onClick={() => send(reply)}
            className="text-xs font-medium border border-[#d4af37]/30 text-[#d4af37] rounded-full px-3 py-1.5 hover:bg-[#d4af37]/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {reply}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your AI advisor about your finances..."
          disabled={loading}
          className="flex-1 bg-[#1c1c1c] border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37]/60 disabled:opacity-50"
        />
        <button
          type="submit"
          aria-label="Send"
          disabled={loading}
          className="bg-[#d4af37] hover:bg-[#c9a431] transition-colors text-black rounded-lg p-2.5 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
