import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, RefreshCcw, User, MessageSquare, Plus, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";
import { SchoolShell } from "@/layouts/SchoolShell";
import { serviceRequest } from "@/services/service-client";

type ActionButton = {
  label: string;
  route: string;
  action_type?: string;
  icon?: string;
};

type Message = { role: "user" | "ai" | "tool"; content: string; buttons?: ActionButton[] };
type Thread = { id: string; title: string; updatedAt: number; messages: Message[] };

export function AdminAIPage() {
  const navigate = useNavigate();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Load threads from local storage on mount
  useEffect(() => {
    const savedThreads = localStorage.getItem("ai_chat_history");
    if (savedThreads) {
      try {
        const parsed = JSON.parse(savedThreads);
        setThreads(parsed);
        if (parsed.length > 0) {
          setActiveThreadId(parsed[0].id);
          setMessages(parsed[0].messages);
        }
      } catch (e) {
        console.error("Failed to parse chat history");
      }
    }
  }, []);

  // Save threads whenever they change
  useEffect(() => {
    if (threads.length > 0) {
      localStorage.setItem("ai_chat_history", JSON.stringify(threads));
    } else {
      localStorage.removeItem("ai_chat_history");
    }
  }, [threads]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNewChat = () => {
    setActiveThreadId(null);
    setMessages([]);
  };

  const handleDeleteThread = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = threads.filter(t => t.id !== id);
    setThreads(updated);
    if (activeThreadId === id) {
      handleNewChat();
    }
  };

  const handleSelectThread = (id: string) => {
    const thread = threads.find(t => t.id === id);
    if (thread) {
      setActiveThreadId(thread.id);
      setMessages(thread.messages);
    }
  };

  const updateThreadHistory = (threadId: string, currentMessages: Message[]) => {
    setThreads(prev => {
      const existing = prev.find(t => t.id === threadId);
      if (existing) {
        return prev.map(t => t.id === threadId ? { ...t, messages: currentMessages, updatedAt: Date.now() } : t).sort((a, b) => b.updatedAt - a.updatedAt);
      } else {
        const title = currentMessages.find(m => m.role === "user")?.content.slice(0, 30) || "New Conversation";
        const newThread: Thread = { id: threadId, title: title + "...", updatedAt: Date.now(), messages: currentMessages };
        return [newThread, ...prev].sort((a, b) => b.updatedAt - a.updatedAt);
      }
    });
  };

  const handleSend = async (message: string) => {
    if (!message.trim()) return;

    const userMessage = message;
    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    const currentThreadId = activeThreadId ?? `thread-${Date.now()}`;

    try {
      const response = await serviceRequest<{ reply: string; quick_buttons?: ActionButton[]; tool_used?: string; data?: any }>("/api/chatbot/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
          history: newMessages.slice(-10).map((m) => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.content,
          })),
        }),
      });

      if (!response.ok || !response.data) {
        throw new Error(response.message || "Failed to fetch response");
      }

      const finalMessages = [
        ...newMessages,
        {
          role: "ai" as const,
          content: response.data.reply || "I couldn't process that request.",
          buttons: response.data.quick_buttons || [],
        },
      ];

      setMessages(finalMessages);
      setActiveThreadId(currentThreadId);
      updateThreadHistory(currentThreadId, finalMessages);
    } catch (error: any) {
      const finalMsgs = [...newMessages, { role: "ai" as const, content: `**Error:** ${error.message}` }];
      setMessages(finalMsgs);
      updateThreadHistory(currentThreadId, finalMsgs);
    } finally {
      setIsLoading(false);
    }
  };

  const actions = [
    "Analyze Student Performance",
    "View Attendance Trends",
    "List All Classes",
    "Generate Fee Report"
  ];

  return (
    <SchoolShell eyebrow="Operational AI" title="Eduplexo Copilot">
      <div className="flex h-[calc(100vh-140px)] w-full rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
        {/* Sidebar - Chat History */}
        <div className="w-64 border-r border-slate-200 bg-slate-50 flex flex-col hidden md:flex">
          <div className="p-4 border-b border-slate-200">
            <button 
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg py-2.5 px-4 font-semibold text-sm hover:bg-blue-700 transition"
            >
              <Plus size={16} /> New Chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {threads.map(thread => (
              <div 
                key={thread.id}
                onClick={() => handleSelectThread(thread.id)}
                className={`flex items-center justify-between group p-3 rounded-xl cursor-pointer transition-colors ${activeThreadId === thread.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-200 text-slate-700'}`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <MessageSquare size={16} className="flex-shrink-0" />
                  <span className="text-sm font-medium truncate">{thread.title}</span>
                </div>
                <button 
                  onClick={(e) => handleDeleteThread(thread.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {threads.length === 0 && (
              <div className="text-center text-slate-400 text-sm mt-10">
                No chat history yet.
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
            <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <Bot size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Eduplexo AI Copilot</h2>
              <p className="text-xs text-slate-500">Enterprise Operational Assistant</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button 
                onClick={() => { setMessages([]); setActiveThreadId(null); }} 
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                <RefreshCcw size={14} /> Clear Context
              </button>
            </div>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center space-y-6">
                <div className="h-20 w-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-2">
                  <Bot size={40} />
                </div>
                <h1 className="text-2xl font-bold text-slate-800">How can I help you manage the school today?</h1>
                <p className="text-slate-500 max-w-md">
                  I am your operational AI Copilot. I have access to live ERP data including students, classes, attendance, exams, and fees.
                </p>
                
                <div className="grid grid-cols-2 gap-3 w-full mt-8">
                  {actions.map((action) => (
                    <button
                      key={action}
                      onClick={() => handleSend(action)}
                      className="p-4 text-sm font-medium bg-white border border-slate-200 text-slate-700 rounded-xl hover:border-blue-300 hover:shadow-md transition text-left flex items-center gap-3"
                    >
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <MessageSquare size={16} />
                      </div>
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-6">
                {messages.map((msg, index) => (
                  <div key={index} className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "ai" && (
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <Bot size={20} />
                      </div>
                    )}
                    {msg.role === "tool" && (
                      <div className="flex-shrink-0 h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                        <Bot size={16} />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white rounded-br-none shadow-md"
                          : msg.role === "tool"
                          ? "bg-slate-50 border border-slate-200 text-slate-500 rounded-bl-none italic text-sm"
                          : "bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm"
                      }`}
                    >
                      {msg.role === "ai" ? (
                        <div className="prose prose-slate prose-p:leading-relaxed prose-pre:bg-slate-800 prose-pre:text-slate-100 max-w-none max-h-[28rem] overflow-y-auto break-words pr-1">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                          {msg.buttons && msg.buttons.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2 not-prose">
                              {msg.buttons.map((btn, buttonIndex) => (
                                <button
                                  key={buttonIndex}
                                  onClick={() => {
                                    if (btn.action_type === "navigate" || btn.action_type === "create" || btn.action_type === "edit") {
                                      navigate(btn.route);
                                    }
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-600 shadow-sm transition-all hover:border-blue-600 hover:bg-blue-600 hover:text-white"
                                >
                                  {btn.icon && <span className="material-symbols-outlined text-[14px]">{btn.icon}</span>}
                                  {btn.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="whitespace-pre-wrap break-words">{msg.content}</span>
                      )}
                    </div>
                    
                    {msg.role === "user" && (
                      <div className="flex-shrink-0 h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600">
                        <User size={20} />
                      </div>
                    )}
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-4 justify-start">
                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                      <Bot size={20} />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-5 py-4 shadow-sm flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                    </div>
                  </div>
                )}
                <div ref={endOfMessagesRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-100">
            <div className="max-w-3xl mx-auto relative flex items-end gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-blue-600/20 focus-within:border-blue-400 transition-all shadow-inner">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(input);
                  }
                }}
                placeholder="Ask the ERP Copilot anything..."
                className="w-full bg-transparent border-none resize-none max-h-32 min-h-[44px] py-2.5 pl-3 pr-2 text-[15px] focus:outline-none custom-scrollbar"
                rows={input.split('\n').length > 1 ? Math.min(input.split('\n').length, 5) : 1}
              />
              <button
                onClick={() => handleSend(input)}
                disabled={!input.trim() || isLoading}
                className="flex-shrink-0 p-3 mb-0.5 rounded-xl bg-blue-600 text-white disabled:bg-slate-300 disabled:cursor-not-allowed transition hover:bg-blue-700 shadow-sm"
              >
                <Send size={18} />
              </button>
            </div>
            <div className="text-center mt-3">
               <span className="text-[11px] text-slate-400 font-medium">Eduplexo AI Copilot • Powered by Advanced ERP Intelligence</span>
            </div>
          </div>
        </div>
      </div>
    </SchoolShell>
  );
}
