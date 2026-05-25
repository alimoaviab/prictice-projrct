import { useState, useRef, useEffect, FormEvent } from "react";

interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  timestamp: string;
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const GEMINI_MODEL = "gemini-2.0-flash";

const SYSTEM_PROMPT = `You are EduPlexo AI Assistant, an intelligent onboarding and support assistant for EduPlexo School Management System — Pakistan's #1 AI-powered School ERP.

ABOUT EDUPLEXO:
EduPlexo is a modern cloud-based School Management ERP designed for schools, colleges, academies, and educational institutes across Pakistan, UAE, Saudi Arabia, and worldwide. It helps institutions manage academics, communication, attendance, exams, homework, fees, and daily operations digitally from one centralized system.
Official Website: https://www.eduplexo.com/

YOUR ROLE: Professional SaaS support and product assistant. Helpful, Friendly, Professional, Product-aware.

LANGUAGE RULES:
- Default = English
- If user writes in Urdu or Roman Urdu, reply in Roman Urdu
- Keep responses friendly and natural, never robotic

PORTALS: EduPlexo provides 4 role-based portals:
1. SCHOOL ADMIN PORTAL: Complete school management (Students, Teachers, Classes, Attendance, Exams, Results, Fees, Timetable, Homework, Live Classes, Events, Certificates, Settings)
2. TEACHER PORTAL: Attendance marking, Homework, Exams, Results, Timetable, Leave, Behavior tracking, Live Classes
3. STUDENT PORTAL: Timetable, Attendance, Homework, Results, Fee Ledger, Leave, Live Classes, Events
4. PARENT PORTAL: Monitor child's attendance, fees, results, performance, announcements

KEY BENEFITS: Cloud-based, Role-based dashboards, Real-time tracking, Centralized management, Multi-academic year support, Trusted by 50+ schools worldwide.

STRICT RULES:
- NEVER mention Super Admin role or competitors
- NEVER give fake pricing
- NEVER invent features
- NEVER say "I am just an AI"
- Keep responses concise (max 150 words)
- Naturally encourage demo booking when suitable
- For demo/pricing: direct to https://www.eduplexo.com/`;

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "bot",
  text: "Hello! I'm the EduPlexo AI Assistant. I can help you learn about our school management platform, features, pricing, and onboarding. How can I help you today?",
  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
};

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Array<{ role: string; parts: Array<{ text: string }> }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      role: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const reply = await callGemini(text, history);

      // Update conversation history
      setHistory((prev) => [
        ...prev,
        { role: "user", parts: [{ text }] },
        { role: "model", parts: [{ text: reply }] },
      ]);

      const botMsg: Message = {
        id: `b_${Date.now()}`,
        role: "bot",
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const errorMsg: Message = {
        id: `e_${Date.now()}`,
        role: "bot",
        text: "Sorry, I'm having trouble right now. Please visit https://www.eduplexo.com/ for more information or try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:scale-105 transition-all flex items-center justify-center"
          aria-label="Open chat"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white animate-pulse" />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-3rem)] bg-white rounded-2xl shadow-2xl shadow-slate-900/20 border border-slate-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold leading-none">EduPlexo Assistant</h3>
                <p className="text-[10px] text-white/70 mt-0.5">Online • Ready to help</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="h-7 w-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              aria-label="Close chat"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-md"
                      : "bg-white text-slate-700 border border-slate-100 shadow-sm rounded-bl-md"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <p className={`text-[9px] mt-1 ${msg.role === "user" ? "text-blue-200" : "text-slate-400"}`}>
                    {msg.timestamp}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="px-3 py-3 border-t border-slate-100 bg-white">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about EduPlexo..."
                className="flex-1 h-10 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="text-[9px] text-slate-400 text-center mt-2">
              Powered by EduPlexo AI • <a href="https://www.eduplexo.com" className="text-blue-500 hover:underline">eduplexo.com</a>
            </p>
          </form>
        </div>
      )}
    </>
  );
}

async function callGemini(
  message: string,
  history: Array<{ role: string; parts: Array<{ text: string }> }>
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not configured");
  }

  const contents = [
    { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
    { role: "model", parts: [{ text: "Understood. I am the EduPlexo AI Assistant. Ready to help visitors learn about EduPlexo." }] },
    ...history.slice(-10), // Last 10 messages for context
    { role: "user", parts: [{ text: message }] },
  ];

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 500,
        topP: 0.9,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini API error: ${res.status}`);
  }

  const data = await res.json();
  const candidates = data?.candidates;
  if (!candidates?.length) {
    throw new Error("No response from AI");
  }

  const parts = candidates[0]?.content?.parts;
  if (!parts?.length) {
    throw new Error("Empty response");
  }

  return parts[0].text;
}
