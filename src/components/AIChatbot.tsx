"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm SafetyHub AI. Ask me anything about campus safety — current conditions, sensor readings, or safety recommendations.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          conversationHistory: messages.slice(-6).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response || "Sorry, I couldn't process that request.",
          timestamp: data.timestamp || new Date().toISOString(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm having trouble connecting right now. Please check the dashboard for current readings.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-purple-600 shadow-lg shadow-purple-500/30 flex items-center justify-center hover:bg-purple-500 transition-colors"
        aria-label="Toggle AI Chat"
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M12 2a4 4 0 0 1 4 4c0 1.5-.8 2.8-2 3.4V11h-4V9.4C8.8 8.8 8 7.5 8 6a4 4 0 0 1 4-4z" />
            <path d="M10 11h4v2a2 2 0 0 1-4 0v-2z" />
            <line x1="12" y1="15" x2="12" y2="19" />
            <line x1="10" y1="19" x2="14" y2="19" />
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-40 right-4 z-50 w-[340px] max-h-[460px] rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-[var(--color-card-border)] flex flex-col bg-[var(--color-background)]">
          {/* Header */}
          <div className="bg-[var(--color-card)] px-4 py-3 flex items-center gap-2 border-b border-[var(--color-card-border)]">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round">
                <path d="M12 2a4 4 0 0 1 4 4c0 1.5-.8 2.8-2 3.4V11h-4V9.4C8.8 8.8 8 7.5 8 6a4 4 0 0 1 4-4z" />
                <path d="M10 11h4v2a2 2 0 0 1-4 0v-2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-foreground)]">SafetyHub AI</p>
              <p className="text-[10px] text-[var(--color-teal)]">Online — Monitoring Active</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[280px] max-h-[320px]">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-purple-600 text-white rounded-br-md"
                      : "bg-[var(--color-card)] text-[var(--color-foreground)] rounded-bl-md border border-[var(--color-card-border)]"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[var(--color-card)] rounded-2xl rounded-bl-md px-4 py-3 border border-[var(--color-card-border)]">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-[var(--color-card-border)] bg-[var(--color-card)]">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask about campus safety..."
                className="flex-1 bg-[var(--color-background)] text-[var(--color-foreground)] text-xs rounded-xl px-3 py-2.5 outline-none border border-[var(--color-card-border)] focus:border-purple-500/50 placeholder:text-[var(--color-muted)]"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center hover:bg-purple-500 transition-colors disabled:opacity-30"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {["Is it safe?", "Gas status?", "Should I evacuate?"].map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setInput(q);
                  }}
                  className="text-[10px] px-2 py-1 rounded-full bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
