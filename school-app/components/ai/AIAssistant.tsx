"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, X, RefreshCcw, User, Maximize2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useRouter } from "next/navigation";

export function AIAssistant({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<{ role: "user" | "ai" | "tool"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const router = useRouter();

  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (message: string) => {
    if (!message.trim()) return;

    const userMessage = message;
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setIsLoading(true);

    try {
      const token = typeof window !== "undefined" ? (localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token")) : "";

      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMessage,
          thread_id: threadId
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to fetch response");
      }

      // Handle streaming
      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      if (reader) {
        let isFirstChunk = true;

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunkString = decoder.decode(value, { stream: true });
          const lines = chunkString.split('\n').filter(l => l.trim() !== '');

          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.type === 'meta') {
                 setThreadId(data.thread_id);
              } else if (data.type === 'chunk') {
                 setIsLoading(false);
                 setMessages(prev => {
                   if (isFirstChunk) {
                     isFirstChunk = false;
                     return [...prev, { role: "ai", content: data.content }];
                   } else {
                     const newMessages = [...prev];
                     const lastMsg = newMessages[newMessages.length - 1];
                     if (lastMsg.role === "ai") {
                        lastMsg.content += data.content;
                     } else {
                        newMessages.push({ role: "ai", content: data.content });
                     }
                     return newMessages;
                   }
                 });
              } else if (data.type === 'tool') {
                 setMessages(prev => [...prev, { role: "tool", content: data.content }]);
              } else if (data.type === 'error') {
                 setMessages(prev => [...prev, { role: "ai", content: `**Error:** ${data.content}` }]);
                 setIsLoading(false);
              }
            } catch (e) {
              // ignore unparseable line
            }
          }
        }
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
    <div className="fixed bottom-4 right-4 z-50 flex h-[600px] w-[400px] flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
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
              router.push("/admin/ai");
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
                  <div className="prose prose-sm prose-slate max-w-none">
                     <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
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
           <button onClick={() => { setMessages([]); setThreadId(null); }} className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1">
             <RefreshCcw size={10} /> Reset
           </button>
        </div>
      </div>
    </div>
  );
}
