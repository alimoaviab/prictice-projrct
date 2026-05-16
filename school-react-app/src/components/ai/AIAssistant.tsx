import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, X, RefreshCcw, User, Maximize2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";

const HISTORY_KEY = "edubot_sidebar_history";

type AssistantMessage = { role: "user" | "ai" | "tool"; content: string; buttons?: any[] };

function loadSavedMessages(): AssistantMessage[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (!saved) {
      return [];
    }
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.slice(-50) : [];
  } catch {
    return [];
  }
}

export function AIAssistant({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<AssistantMessage[]>(() => loadSavedMessages());
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const navigate = useNavigate();

  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (messages.length > 0) {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-50)));
    }
  }, [messages]);

  const handleSend = async (message: string) => {
    if (!message.trim()) return;

    const userMessage = message;
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setIsLoading(true);

    try {
      const token = typeof window !== "undefined" ? (localStorage.getItem("token") || sessionStorage.getItem("token")) : "";

      const response = await fetch("/api/chatbot/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        credentials: "include",
        body: JSON.stringify({
          message: userMessage,
          history: messages.slice(-10).map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.content })),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to fetch response");
      }

      const data = await response.json();
      const reply = data?.data?.reply || data?.reply || "I couldn't process that request.";
      const buttons = data?.data?.quick_buttons || data?.quick_buttons || [];
      
      setMessages(prev => [...prev, { role: "ai", content: reply, buttons }]);

      if (data?.data?.tool_used) {
        // Optionally show tool info
      }

    } catch (error: any) {
      setMessages((prev) => [...prev, { role: "ai", content: `**Error:** ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const actions = [
    "View Attendance",
    "View Result",
    "Add Student"
  ];

  return (
    <div className="fixed inset-4 z-50 flex h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl md:inset-6 md:h-[calc(100vh-3rem)] md:w-[calc(100vw-3rem)]">
      {/* Header */}
      <div className="flex items-center justify-between bg-blue-600 px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <h3 className="font-bold">ERP Assistant</h3>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => {
              onClose();
              navigate("/admin/ai");
            }} 
            className="rounded-md p-1 hover:bg-white/20 transition"
            title="Expand to Full Page"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-white/20 transition">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="text-center text-slate-500 mt-10">
            <Bot className="h-10 w-10 mx-auto mb-3 text-blue-300" />
            <p className="text-sm font-medium">Hello! I'm your intelligent ERP Assistant.</p>
            <p className="text-xs mt-1">How can I help you today?</p>

            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {actions.map((action) => (
                <button
                  key={action}
                  onClick={() => handleSend(action)}
                  className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-blue-600 rounded-full hover:bg-blue-50 transition shadow-sm"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "ai" && (
                <div className="flex-shrink-0 mt-1 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 animate-glow">
                  <Bot size={16} />
                </div>
              )}
              {msg.role === "tool" && (
                <div className="flex-shrink-0 mt-1 h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                  <Bot size={12} />
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-[13px] ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-600/20"
                    : msg.role === "tool"
                    ? "bg-slate-100 border border-slate-200 text-slate-500 rounded-bl-none shadow-sm italic text-xs"
                    : "bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm"
                }`}
              >
                {msg.role === "ai" ? (
                  <div className="prose prose-sm prose-slate max-w-none max-h-72 overflow-y-auto break-words pr-1">
                     <ReactMarkdown>{msg.content}</ReactMarkdown>
                     {msg.buttons && msg.buttons.length > 0 && (
                       <div className="mt-4 flex flex-wrap gap-2">
                         {msg.buttons.map((btn, bIdx) => (
                           <button
                             key={bIdx}
                             onClick={() => {
                               if (btn.action_type === "navigate" || btn.action_type === "create" || btn.action_type === "edit") {
                                 navigate(btn.route);
                               } else {
                                 handleSend(btn.label);
                               }
                             }}
                             className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold bg-blue-50 border border-blue-100 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
                           >
                             {btn.icon && <span className="material-symbols-outlined text-[14px]">{btn.icon}</span>}
                             {btn.label}
                           </button>
                         ))}
                       </div>
                     )}
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto whitespace-pre-wrap break-words pr-1">{msg.content}</div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="flex-shrink-0 mt-1 h-8 w-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-500">
                  <User size={16} />
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 mt-1 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <Bot size={16} />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
               <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
               <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-slate-200">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend(input);
            }}
            placeholder="Ask anything..."
            className="w-full bg-slate-100 border-none rounded-full py-2.5 pl-4 pr-12 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isLoading}
            className="absolute right-1 p-2 rounded-full bg-blue-600 text-white disabled:bg-slate-300 disabled:cursor-not-allowed transition hover:bg-blue-700"
          >
            <Send size={14} />
          </button>
        </div>
        <div className="text-center mt-2 flex justify-between items-center px-1">
           <span className="text-[9px] text-slate-400 font-medium">Enterprise AI Copilot</span>
           <button onClick={() => { setMessages([]); setThreadId(null); localStorage.removeItem(HISTORY_KEY); }} className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1">
             <RefreshCcw size={10} /> Reset
           </button>
        </div>
      </div>
    </div>
  );
}
