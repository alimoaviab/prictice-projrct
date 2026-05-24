import { AppIcon } from "shared/ui/AppIcon";
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./chatbot.css";

interface ActionButton {
  label: string;
  path: string;
  intent: "navigate" | "create" | "view" | string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  streaming?: boolean;
  actions?: ActionButton[];
}

type Language = "english" | "urdu";

const QUICK_SUGGESTIONS: Record<Language, string[]> = {
  english: [
    "How do I create a class?",
    "How do I add a new student?",
    "How do I add a teacher?",
    "How do I mark attendance?",
    "How do I create an exam?",
  ],
  urdu: [
    "Class kaise banayein?",
    "Naya student kaise add karein?",
    "Teacher kaise add karein?",
    "Attendance kaise lagayein?",
    "Exam kaise banayein?",
  ],
};

const UI_STRINGS: Record<Language, {
  title: string;
  subtitle: string;
  placeholder: string;
  greeting: string;
  greetingHint: string;
  clearTitle: string;
  closeTitle: string;
  langTitle: string;
  expiredSession: string;
  rateLimited: string;
  genericError: string;
  connectionError: string;
}> = {
  english: {
    title: "Plexa",
    subtitle: "AI assistant for your school",
    placeholder: "Type your message…",
    greeting: "Hello! I am Plexa.",
    greetingHint: "Try asking:",
    clearTitle: "Clear chat",
    closeTitle: "Close",
    langTitle: "Language",
    expiredSession: "Your session has expired. Please log in again.",
    rateLimited: "Too many messages. Please wait a moment.",
    genericError: "Something went wrong. Please try again.",
    connectionError: "Connection error. Please check your internet and try again.",
  },
  urdu: {
    title: "Plexa",
    subtitle: "Aapke school ka AI assistant",
    placeholder: "Apna sawal likhein…",
    greeting: "Assalam o Alaikum! Main Plexa hun.",
    greetingHint: "Yeh pooch kar dekhein:",
    clearTitle: "Chat saaf karein",
    closeTitle: "Band karein",
    langTitle: "Zuban",
    expiredSession: "Aapka session khatam ho gaya. Dobara login karein.",
    rateLimited: "Bohat zyada messages. Thora intezar karein.",
    genericError: "Kuch galat ho gaya. Dobara koshish karein.",
    connectionError: "Connection ki kharabi. Internet check kar ke dobara try karein.",
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────

function getSessionId(): string {
  const key = "plexa_session_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

function getStoredJWT(): string | undefined {
  const raw = localStorage.getItem("token");
  if (!raw) return undefined;
  const trimmed = raw.trim();
  return trimmed.startsWith("eyJ") ? trimmed : undefined;
}

function readStoredLanguage(): Language {
  const v = localStorage.getItem("plexa_language");
  return v === "urdu" ? "urdu" : "english";
}

/**
 * Parse a string of concatenated SSE events into individual `{event, data}`
 * frames. Returns the parsed frames plus any leftover partial frame that
 * must be carried into the next chunk.
 */
function parseSSEBuffer(
  buffer: string
): { frames: { event: string; data: any }[]; rest: string } {
  const frames: { event: string; data: any }[] = [];
  const parts = buffer.split("\n\n");
  // The last element is potentially an incomplete frame
  const rest = parts.pop() ?? "";

  for (const part of parts) {
    if (!part.trim()) continue;
    let event = "message";
    let data = "";
    for (const line of part.split("\n")) {
      if (line.startsWith("event:")) {
        event = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        data += line.slice(5).trim();
      }
    }
    if (data) {
      try {
        frames.push({ event, data: JSON.parse(data) });
      } catch {
        // ignore malformed frame
      }
    }
  }
  return { frames, rest };
}

// ─── Component ──────────────────────────────────────────────────────────

const ICON_BY_INTENT: Record<string, string> = {
  navigate: "arrow_forward",
  create: "add_circle",
  view: "visibility",
};

/**
 * Plexa Chat Widget — floating bottom-right chat panel with streaming.
 * Uses POST + ReadableStream against /chat/stream so we can include the
 * Authorization header (which native EventSource does not support).
 */
export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<Language>(() => readStoredLanguage());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const navigate = useNavigate();

  const t = UI_STRINGS[language];
  // Roman Urdu uses English script — always LTR
  const isRtl = false;

  useEffect(() => {
    const saved = localStorage.getItem("plexa_messages");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      // Don't persist messages still being streamed
      const persistable = messages.filter(m => !m.streaming);
      if (persistable.length > 0) {
        localStorage.setItem("plexa_messages", JSON.stringify(persistable.slice(-50)));
      }
    }
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("plexa_language", language);
  }, [language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  // Cancel an active stream when the widget unmounts
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const addMessage = useCallback((msg: Omit<Message, "id" | "timestamp">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setMessages(prev => [...prev, {
      ...msg,
      id,
      timestamp: new Date(),
    }]);
    return id;
  }, []);

  const updateMessage = useCallback(
    (id: string, fn: (m: Message) => Partial<Message>) => {
      setMessages(prev => prev.map(m => (m.id === id ? { ...m, ...fn(m) } : m)));
    },
    []
  );

  // ─── Streaming send ──────────────────────────────────────────────────
  const sendMessage = async (text?: string) => {
    const userMessage = (text || input).trim();
    if (!userMessage || isLoading) return;

    setInput("");
    addMessage({ role: "user", content: userMessage });
    const assistantId = addMessage({
      role: "assistant",
      content: "",
      streaming: true,
    });
    setIsLoading(true);

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const token = getStoredJWT();
      const res = await fetch("/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: userMessage,
          session_id: getSessionId(),
          language,
        }),
        signal: abort.signal,
      });

      if (res.status === 401) {
        updateMessage(assistantId, () => ({
          content: t.expiredSession,
          streaming: false,
        }));
        return;
      }
      if (res.status === 429) {
        updateMessage(assistantId, () => ({
          content: t.rateLimited,
          streaming: false,
        }));
        return;
      }
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => null);
        updateMessage(assistantId, () => ({
          content: err?.detail || t.genericError,
          streaming: false,
        }));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const { frames, rest } = parseSSEBuffer(buffer);
        buffer = rest;

        for (const { event, data } of frames) {
          switch (event) {
            case "meta":
              // No-op for now; could store message_id if needed
              break;
            case "chunk": {
              fullText += data.text || "";
              const snapshot = fullText;
              updateMessage(assistantId, () => ({ content: snapshot }));
              break;
            }
            case "replace": {
              fullText = data.text || "";
              const snapshot = fullText;
              updateMessage(assistantId, () => ({ content: snapshot }));
              break;
            }
            case "actions":
              updateMessage(assistantId, () => ({ actions: data.actions || [] }));
              break;
            case "error":
              updateMessage(assistantId, () => ({
                content: fullText || data.detail || t.genericError,
                streaming: false,
              }));
              break;
            case "done":
              updateMessage(assistantId, () => ({ streaming: false }));
              break;
          }
        }
      }
    } catch (err) {
      if ((err as Error)?.name === "AbortError") {
        // user cancelled — leave whatever has been streamed so far
        updateMessage(assistantId, () => ({ streaming: false }));
        return;
      }
      updateMessage(assistantId, m => ({
        content: m.content || t.connectionError,
        streaming: false,
      }));
    } finally {
      setIsLoading(false);
      // Final guard: ensure no message is left stuck on `streaming=true`
      updateMessage(assistantId, () => ({ streaming: false }));
      abortRef.current = null;
      // Auto-focus input so user can type next message immediately
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const stopStreaming = () => {
    abortRef.current?.abort();
  };

  const clearChat = async () => {
    const token = getStoredJWT();
    const sessionId = getSessionId();

    try {
      await fetch("/chat/session", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ session_id: sessionId }),
      });
    } catch { /* ignore */ }

    setMessages([]);
    localStorage.removeItem("plexa_messages");
    localStorage.removeItem("plexa_session_id");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleAction = (action: ActionButton) => {
    setIsOpen(false);
    navigate(action.path);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl shadow-blue-600/30 hover:bg-blue-700 hover:scale-105 transition-all"
        aria-label="Open Plexa"
      >
        <AppIcon name="Bot" size={28} />
        <span className="absolute top-0 right-0 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
        </span>
      </button>
    );
  }

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className="plexa-widget fixed bottom-6 right-6 z-[60] w-[400px] h-[560px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300"
    >
      {/* Header */}
      <div dir="ltr" className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
            <AppIcon name="Bot" size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold">{t.title}</h3>
            <p className="text-[10px] text-blue-100">{t.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            title={t.langTitle}
            className="bg-white/15 hover:bg-white/25 text-white text-xs font-medium rounded-md px-2 py-1 border-0 outline-none focus:ring-2 focus:ring-white/40 cursor-pointer transition-colors"
          >
            <option value="english" className="text-slate-800">EN</option>
            <option value="urdu" className="text-slate-800">RU</option>
          </select>
          <button onClick={clearChat} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" title={t.clearTitle}>
            <AppIcon name="Trash2" size={16} />
          </button>
          <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" title={t.closeTitle}>
            <AppIcon name="X" size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 ${isRtl ? "plexa-rtl" : ""}`}>
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
              <AppIcon name="Hand" size={24} className="text-blue-600" />
            </div>
            <p className="text-sm font-semibold text-slate-700 mb-1">{t.greeting}</p>
            <p className="text-xs text-slate-500 mb-4">{t.greetingHint}</p>
            <div className="space-y-2">
              {QUICK_SUGGESTIONS[language].map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className={`block w-full px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors ${isRtl ? "text-right" : "text-left"}`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const showDots = msg.role === "assistant" && msg.streaming && !msg.content;

          return (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`flex flex-col gap-2 max-w-[88%]`}>
                <div className={`px-3 py-2 text-[13px] leading-relaxed ${msg.role === "user"
                    ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm"
                    : "bg-white text-slate-700 rounded-2xl rounded-tl-sm border border-slate-200 shadow-sm"
                  }`}>
                  {showDots ? (
                    <div className="plexa-typing flex items-center gap-1.5 py-0.5">
                      <span className="plexa-dot" />
                      <span className="plexa-dot" />
                      <span className="plexa-dot" />
                    </div>
                  ) : msg.role === "assistant" ? (
                    <div className="plexa-prose break-words max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      {msg.streaming && (
                        <span className="plexa-caret" aria-hidden="true">▍</span>
                      )}
                    </div>
                  ) : (
                    <span className="whitespace-pre-wrap break-words">{msg.content}</span>
                  )}
                </div>

                {/* Action buttons */}
                {msg.role === "assistant" && msg.actions && msg.actions.length > 0 && (
                  <div className={`flex flex-wrap gap-1.5 ${isRtl ? "justify-end" : "justify-start"}`}>
                    {msg.actions.map((a, i) => (
                      <button
                        key={`${msg.id}-act-${i}`}
                        onClick={() => handleAction(a)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-full transition-colors active:scale-95"
                      >
                        <AppIcon name={ICON_BY_INTENT[a.intent] || "arrow_forward"} size={15} />
                        {a.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div dir={isRtl ? "rtl" : "ltr"} className="p-3 border-t border-slate-200 bg-white">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.placeholder}
            disabled={isLoading}
            autoFocus
            className={`flex-1 h-10 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-600/10 transition-all disabled:opacity-50 ${isRtl ? "text-right" : "text-left"}`}
          />
          {isLoading ? (
            <button
              onClick={stopStreaming}
              className="h-10 w-10 rounded-xl bg-slate-700 text-white flex items-center justify-center hover:bg-slate-800 transition-colors"
              aria-label="Stop"
              title="Stop"
            >
              <AppIcon name="Square" size={18} />
            </button>
          ) : (
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim()}
              className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send"
            >
              <AppIcon name="Send" size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
