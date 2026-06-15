"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function LuminaAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "lumina"; text: string }[]>([
    { role: "lumina", text: "Welcome to LuminaForge. I'm Lumina, your AI wealth assistant. Ask me about your portfolio, market insights, or tax planning." },
  ]);
  const [loading, setLoading] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });
      const data = await res.json() as { answer?: string };
      setMessages((m) => [...m, { role: "lumina", text: data.answer ?? "I'm processing your request." }]);
    } catch {
      setMessages((m) => [...m, { role: "lumina", text: "I'm temporarily unavailable. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="glass-panel w-80 rounded-2xl overflow-hidden shadow-2xl"
            style={{ border: "1px solid rgba(244,201,93,0.25)" }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid rgba(244,201,93,0.12)" }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: "linear-gradient(135deg,#f4c95d,#c9a43a)", color: "#0f172a" }}
                >
                  L
                </div>
                <span className="text-sm font-semibold gold-text">Lumina AI</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-500 hover:text-slate-300 text-sm"
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div className="flex flex-col gap-2 p-4 h-56 overflow-y-auto text-sm">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`rounded-xl px-3 py-2 max-w-[90%] ${
                    m.role === "user"
                      ? "self-end text-right"
                      : "self-start"
                  }`}
                  style={{
                    background: m.role === "user"
                      ? "rgba(244,201,93,0.15)"
                      : "rgba(34,211,238,0.08)",
                    color: m.role === "user" ? "#f1f5f9" : "#94a3b8",
                    border: m.role === "user"
                      ? "1px solid rgba(244,201,93,0.2)"
                      : "1px solid rgba(34,211,238,0.12)",
                  }}
                >
                  {m.text}
                </div>
              ))}
              {loading && (
                <div className="self-start flex items-center gap-1 text-slate-500 px-2">
                  <span className="animate-pulse">●</span>
                  <span className="animate-pulse delay-75">●</span>
                  <span className="animate-pulse delay-150">●</span>
                </div>
              )}
            </div>

            {/* Input */}
            <div
              className="flex items-center gap-2 px-3 pb-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void send()}
                placeholder="Ask about your wealth…"
                className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-600 outline-none rounded px-2 py-1"
                style={{ background: "rgba(30,41,59,0.6)", border: "1px solid rgba(244,201,93,0.15)" }}
              />
              <button
                onClick={() => void send()}
                disabled={loading}
                className="gold-btn rounded-lg px-3 py-1 text-xs disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="h-13 w-13 rounded-full shadow-2xl flex items-center justify-center text-xl font-bold"
        style={{
          background: "linear-gradient(135deg,#f4c95d,#c9a43a)",
          color: "#0f172a",
          width: 52,
          height: 52,
          boxShadow: "0 0 24px rgba(244,201,93,0.35)",
        }}
        title="Lumina AI Wealth Assistant"
      >
        ✦
      </motion.button>
    </div>
  );
}
