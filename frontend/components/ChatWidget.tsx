"use client";
import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, ChefHat } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

const QUICK_REPLIES = [
  { label: "🍱 Services",      text: "What catering services do you offer?" },
  { label: "💰 Pricing",       text: "What are your prices per head?" },
  { label: "📋 Menu",          text: "What's on your menu?" },
  { label: "📍 Locations",     text: "Which cities do you serve?" },
  { label: "🎁 Discounts",     text: "Do you have any discounts?" },
  { label: "📅 How to Book",   text: "How do I place an order?" },
];

interface Message {
  role: "user" | "assistant";
  text: string;
  time: string;
}

function getTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function parseMarkdown(text: string): string {
  // Process tables before other transforms (they're multi-line)
  const lines = text.split("\n");
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const t = lines[i].trim();
    if (t.startsWith("|") && t.endsWith("|") && t.length > 1) {
      const block: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        block.push(lines[i].trim());
        i++;
      }
      // separator row contains only |, -, :, spaces
      const isSep = block.length >= 2 && block[1].replace(/[\|\-\:\s]/g, "") === "";
      if (isSep) {
        const cols = block[0].split("|").filter(Boolean).map(c => c.trim());
        const rows = block.slice(2).map(r => r.split("|").filter(Boolean).map(c => c.trim()));
        const th = cols.map(c => `<th style="border:1px solid #e5e7eb;padding:4px 8px;background:#f9fafb;font-weight:600;text-align:left;white-space:nowrap">${c}</th>`).join("");
        const td = rows.map(r =>
          `<tr>${r.map(c => `<td style="border:1px solid #e5e7eb;padding:4px 8px;white-space:nowrap">${c}</td>`).join("")}</tr>`
        ).join("");
        out.push(`<div style="overflow-x:auto;margin:6px 0"><table style="border-collapse:collapse;font-size:11px;width:100%"><thead><tr>${th}</tr></thead><tbody>${td}</tbody></table></div>`);
      } else {
        block.forEach(l => out.push(l));
      }
      continue;
    }
    out.push(lines[i]);
    i++;
  }

  return out.join("\n")
    .replace(/^#{1,3}\s+(.+)/gm, "<strong class='block text-gray-900 mt-1 mb-0.5'>$1</strong>")
    .replace(/^---$/gm, "<hr class='my-2 border-gray-200' />")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "<a href='$2' target='_blank' rel='noopener noreferrer' class='text-brand-600 underline hover:text-brand-800'>$1</a>")
    .replace(/^[-•]\s(.+)/gm, "<li class='ml-4 list-disc'>$1</li>")
    .replace(/^\d+\.\s(.+)/gm, "<li class='ml-4 list-decimal'>$1</li>")
    .replace(/\n/g, "<br />");
}

function sessionId() {
  if (typeof window === "undefined") return "ssr";
  let id = sessionStorage.getItem("ce_chat_sid");
  if (!id) { id = "s_" + Math.random().toString(36).slice(2, 10); sessionStorage.setItem("ce_chat_sid", id); }
  return id;
}

export default function ChatWidget() {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showQuick, setShowQuick] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: "assistant",
        text: "👋 Hi! I'm CaterEase AI. Ask me anything about our services, pricing, or menu — I'm here to help!",
        time: getTime(),
      }]);
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");
    setShowQuick(false);
    setMessages((prev) => [...prev, { role: "user", text: trimmed, time: getTime() }]);
    setLoading(true);

    // Add empty assistant placeholder — will fill with streamed tokens
    setMessages((prev) => [...prev, { role: "assistant", text: "", time: getTime() }]);

    try {
      const res = await fetch(`${API}/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, session_id: sessionId() }),
      });

      if (!res.body) throw new Error("no stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.token) {
              setMessages((prev) => {
                const msgs = [...prev];
                const last = msgs[msgs.length - 1];
                msgs[msgs.length - 1] = { ...last, text: last.text + data.token };
                return msgs;
              });
            }
            if (data.error) {
              setMessages((prev) => {
                const msgs = [...prev];
                msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], text: data.error };
                return msgs;
              });
            }
          } catch { /* skip malformed line */ }
        }
      }
    } catch {
      setMessages((prev) => {
        const msgs = [...prev];
        msgs[msgs.length - 1] = {
          ...msgs[msgs.length - 1],
          text: "Sorry, I'm having trouble right now. Please try again or call us directly.",
        };
        return msgs;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Chat window */}
      <div className={`fixed bottom-24 right-5 z-[9998] w-[360px] max-w-[calc(100vw-24px)] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${
        open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-90 pointer-events-none"
      }`} style={{ height: "520px" }}>

        {/* Header */}
        <div className="bg-gradient-to-r from-brand-600 to-orange-500 px-5 py-4 flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-sm leading-tight">CaterEase AI</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-orange-100 text-[11px]">Always online · Replies instantly</span>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
          {messages.map((m, i) => (
            // Skip empty assistant placeholder — typing dots handle that state
            m.role === "assistant" && m.text === "" ? null :
            <div key={i} className={`flex gap-2 items-end ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              {m.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-orange-400 flex items-center justify-center flex-shrink-0 mb-4">
                  <ChefHat className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div className={`max-w-[80%]`}>
                <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-brand-500 text-white rounded-br-sm"
                    : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm"
                }`}>
                  {m.role === "assistant"
                    ? <span dangerouslySetInnerHTML={{ __html: parseMarkdown(m.text) }} />
                    : m.text}
                </div>
                <p className={`text-[10px] text-gray-400 mt-1 ${m.role === "user" ? "text-right" : ""}`}>{m.time}</p>
              </div>
            </div>
          ))}

          {loading && messages[messages.length - 1]?.text === "" && (
            <div className="flex gap-2 items-end">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-orange-400 flex items-center justify-center flex-shrink-0">
                <ChefHat className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-white shadow-sm border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5">
                {[0,1,2].map((i) => (
                  <span key={i} className="w-2 h-2 rounded-full bg-brand-300 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick replies */}
        {showQuick && (
          <div className="px-3 py-2 flex gap-2 flex-wrap bg-gray-50 border-t border-gray-100 flex-shrink-0">
            {QUICK_REPLIES.map((q) => (
              <button key={q.label} onClick={() => send(q.text)}
                className="bg-white border border-brand-200 text-brand-700 text-[11px] font-semibold px-3 py-1.5 rounded-full hover:bg-brand-500 hover:text-white hover:border-brand-500 transition-all whitespace-nowrap">
                {q.label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-3 py-3 bg-white border-t border-gray-100 flex gap-2 items-center flex-shrink-0">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder="Ask about pricing, menu, services…"
            className="flex-1 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-gray-50"
          />
          <button onClick={() => send(input)} disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white flex items-center justify-center transition-all flex-shrink-0">
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-300 pb-2 bg-white">Powered by Claude AI</p>
      </div>

      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`fixed bottom-5 right-5 z-[9999] w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-orange-400 text-white shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-brand-500/40 active:scale-95 ${open ? "rotate-90" : ""}`}
        aria-label="Open chat">
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </>
  );
}
