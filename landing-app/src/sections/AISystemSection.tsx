import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, Sparkles, TrendingUp, AlertTriangle } from "@/components/icons";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

export const AISystemSection = () => {
  // Chatbot State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Hello! I am **Plexa**, your Eduplexo AI Command Agent. I have real-time access to your school's database. Ask me about classes, students, attendance, or finance. 🚀",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeRole, setActiveRole] = useState<"Admin" | "Finance" | "Teacher">("Admin");
  
  // Autoplay Demo State
  const [isAutoplayActive, setIsAutoplayActive] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<any>(null);
  const isInitialMount = useRef(true);

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Demo sequence definition
  const demoSequence = [
    {
      role: "user",
      text: "how many classes in my school?",
      roleType: "Admin" as const
    },
    {
      role: "bot",
      text: "There are currently **20 active classes** across all grade levels (Grade 1 to Grade 10, including sections A & B). \n\n• Primary: **10 classes**\n• Middle: **6 classes**\n• High School: **4 classes**",
      roleType: "Admin" as const
    },
    {
      role: "user",
      text: "how many student in my school",
      roleType: "Admin" as const
    },
    {
      role: "bot",
      text: "We have **290 active students** currently enrolled. Here's a quick demographic breakdown: \n\n• Male: **152 students** (52.4%)\n• Female: **138 students** (47.6%)\n• Staff-to-Student Ratio: **1:15**",
      roleType: "Admin" as const
    },
    {
      role: "user",
      text: "what is today's attendance summary",
      roleType: "Teacher" as const
    },
    {
      role: "bot",
      text: "Today's overall student attendance rate is **94.8%**:\n\n• Present: **275 students**\n• Absent: **15 students**\n\n*⚠️ Alert: Grade 9-B attendance dropped to 78% today (5 absentees). Would you like me to automatically draft notification SMS alerts to their guardians?*",
      roleType: "Teacher" as const
    },
    {
      role: "user",
      text: "predict next month's fee collection",
      roleType: "Finance" as const
    },
    {
      role: "bot",
      text: "Analyzing transaction patterns & payment delays: \n\n• Expected Collection: **$24,500**\n• High Risk of Default: **3 accounts ($1,200 total)**\n\n*💡 AI Recommendation: Send friendly ledger automated reminders to the 3 flagged accounts by clicking 'Approve Reminders'.*",
      roleType: "Finance" as const
    }
  ];

  // Handle manual question submitting
  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputVal;
    if (!text.trim()) return;

    // Add User Message
    const userMsg: Message = {
      id: Math.random().toString(),
      sender: "user",
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputVal("");
    setIsTyping(true);

    // Answer logic
    setTimeout(() => {
      let botText = "";
      const q = text.toLowerCase().trim();

      if (q.includes("class")) {
        botText = "There are currently **20 active classes** across all grade levels (Grade 1 to Grade 10, including sections A & B). \n\n• Primary: **10 classes**\n• Middle: **6 classes**\n• High School: **4 classes**";
      } else if (q.includes("student")) {
        botText = "We have **290 active students** currently enrolled. Here's a quick demographic breakdown: \n\n• Male: **152 students** (52.4%)\n• Female: **138 students** (47.6%)\n• Staff-to-Student Ratio: **1:15**";
      } else if (q.includes("attendance")) {
        botText = "Today's overall student attendance rate is **94.8%**:\n\n• Present: **275 students**\n• Absent: **15 students**\n\n*⚠️ Alert: Grade 9-B attendance dropped to 78% today (5 absentees). Would you like me to automatically draft notification SMS alerts to their guardians?*";
      } else if (q.includes("fee") || q.includes("collection") || q.includes("predict") || q.includes("finance")) {
        botText = "Analyzing transaction patterns & payment delays: \n\n• Expected Collection: **$24,500**\n• High Risk of Default: **3 accounts ($1,200 total)**\n\n*💡 AI Recommendation: Send friendly ledger automated reminders to the 3 flagged accounts by clicking 'Approve Reminders'.*";
      } else if (q.includes("hello") || q.includes("hi") || q.includes("hey") || q.includes("plexora")) {
        botText = "Hello! I am **Plexa**, your Eduplexo AI Agent. How can I help you manage your school today? You can ask me details about student enrollment, classrooms, today's attendance metrics, or financial collections!";
      } else {
        botText = `I have completed an audit based on your query: "${text}". Currently, your school is running optimally with **20 active classes**, **290 students**, and **94.8% average attendance**. Is there any specific metric you want me to analyze?`;
      }

      const botMsg: Message = {
        id: Math.random().toString(),
        sender: "bot",
        text: botText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 1200);
  };

  // Autoplay Typing Loop
  useEffect(() => {
    if (!isAutoplayActive) return;

    if (demoStep >= demoSequence.length) {
      // Loop finished, restart or pause
      setIsAutoplayActive(false);
      setDemoStep(0);
      return;
    }

    const currentAction = demoSequence[demoStep];

    if (currentAction.role === "user") {
      setActiveRole(currentAction.roleType);
      
      // Simulate typing character by character
      let currentString = "";
      let charIndex = 0;
      const targetText = currentAction.text;

      const typingInterval = setInterval(() => {
        if (charIndex < targetText.length) {
          currentString += targetText[charIndex];
          setInputVal(currentString);
          charIndex++;
        } else {
          clearInterval(typingInterval);
          // Wait briefly, then send the message
          setTimeout(() => {
            handleSend(targetText);
            setInputVal("");
            setDemoStep((prev) => prev + 1);
          }, 600);
        }
      }, 75); // speed of typing

      return () => clearInterval(typingInterval);
    } else {
      // It's Bot response, wait for it to finish typing
      if (isTyping) {
        // Wait, bot is thinking
        return;
      }
      
      // Bot has finished response, wait 3.5s so the user can read, then go to next question
      const timer = setTimeout(() => {
        setDemoStep((prev) => prev + 1);
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [isAutoplayActive, demoStep, isTyping]);

  const toggleAutoplay = () => {
    if (isAutoplayActive) {
      setIsAutoplayActive(false);
    } else {
      // Clear previous chats to make the demo clean
      setMessages([
        {
          id: "welcome-demo",
          sender: "bot",
          text: "Let me show you a quick tour of how I work as your virtual command agent. Watch me fetch data dynamically...",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setDemoStep(0);
      setIsAutoplayActive(true);
    }
  };

  const handleReset = () => {
    setIsAutoplayActive(false);
    setDemoStep(0);
    setInputVal("");
    setIsTyping(false);
    setMessages([
      {
        id: "welcome-reset",
        sender: "bot",
        text: "Chat history cleared. Ask me a question about **classes**, **students**, **attendance**, or **fees**, or pick one of the chips below!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Quick prompt click handler
  const handleChipClick = (question: string, role: "Admin" | "Finance" | "Teacher") => {
    setIsAutoplayActive(false);
    setActiveRole(role);
    setInputVal(question);
    // Auto trigger send after a tiny delay to feel natural
    setTimeout(() => {
      handleSend(question);
    }, 300);
  };

  // Helper to format bot responses with bold tags and lists
  const formatMessageText = (text: string) => {
    return text.split("\n").map((line, lineIdx) => {
      // Check for bullet lists
      const isBullet = line.trim().startsWith("•");
      let cleanLine = isBullet ? line.trim().substring(1).trim() : line;
      
      // Parse markdown bold **text**
      const parts: (string | React.ReactNode)[] = [];
      let lastIndex = 0;
      const regex = /\*\*(.*?)\*\*/g;
      let match;
      
      while ((match = regex.exec(cleanLine)) !== null) {
        if (match.index > lastIndex) {
          parts.push(cleanLine.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="text-blue-300 font-bold">{match[1]}</strong>);
        lastIndex = regex.lastIndex;
      }
      
      if (lastIndex < cleanLine.length) {
        parts.push(cleanLine.substring(lastIndex));
      }

      // Check for alerts/italics *text*
      const hasItalic = parts.some(p => typeof p === 'string' && ((p as string).includes('*') || (p as string).includes('_')));
      
      return (
        <div key={lineIdx} className={`mb-2 last:mb-0 ${isBullet ? "pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-blue-400" : ""}`}>
          {hasItalic ? (
            <em className="text-slate-300 text-xs block bg-blue-950/40 border-l-2 border-blue-500/50 p-2 rounded-r-md my-2 font-light leading-relaxed">
              {parts.map((p, pIdx) => typeof p === 'string' ? (p as string).replace(/\*/g, '') : p)}
            </em>
          ) : (
            parts.length > 0 ? parts : cleanLine
          )}
        </div>
      );
    });
  };

  return (
    <section id="ai-system" className="py-32 bg-slate-950 relative overflow-hidden">
      {/* Background Neural Network Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/15 via-indigo-950/5 to-transparent opacity-60 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

          {/* Left Content (5 Cols) */}
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold mb-6"
            >
              <BrainCircuit className="w-4 h-4 animate-pulse" />
              <span className="tracking-wide">Meet Plexa AI Agent</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight leading-[1.15]"
            >
              An intelligent agent <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-sky-400">
                that runs your school.
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: 0.2 }}
              className="text-lg text-slate-400 mb-8 leading-relaxed font-medium"
            >
              Say goodbye to boring forms and complex queries. **Plexa** is your conversational ERP command agent. Just ask questions, verify metrics, and dispatch automatic notifications through a sleek dialogue interface.
            </motion.p>

            <div className="space-y-5">
              {[
                { 
                  icon: TrendingUp, 
                  title: "Instant SQL-free Analytics", 
                  desc: "Plexa turns natural questions like 'how many students' or 'how many classes' into database-level queries instantly.", 
                  color: "text-emerald-400",
                  bgColor: "bg-emerald-500/5"
                },
                { 
                  icon: AlertTriangle, 
                  title: "Proactive Warning Triggers", 
                  desc: "Detects sudden attendance drops, payment delays, or grade deficits and suggests immediate actionable parent notifications.", 
                  color: "text-amber-400",
                  bgColor: "bg-amber-500/5"
                },
                { 
                  icon: Sparkles, 
                  title: "Role-Based Intelligence", 
                  desc: "Tailored to think like a Finance director, a Principal Admin, or an engaged Teacher, serving custom charts and summaries.", 
                  color: "text-purple-400",
                  bgColor: "bg-purple-500/5"
                }
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: 0.3 + (idx * 0.1) }}
                  className="flex gap-4 p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:bg-slate-900/90 hover:border-slate-700/50 transition-all duration-300"
                >
                  <div className={`mt-1 p-2 rounded-xl ${item.bgColor} ${item.color} flex items-center justify-center h-10 w-10 shrink-0`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1 text-base">{item.title}</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Visual: Interactive Plexa Chatbot Simulator (7 Cols) */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6 }}
              className="relative w-full max-w-[720px] mx-auto rounded-3xl border border-slate-800/80 bg-slate-900/80 backdrop-blur-2xl shadow-2xl overflow-hidden"
            >
              {/* Window Header */}
              <div className="flex items-center justify-between px-6 py-4 bg-slate-950/60 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  {/* Window dots */}
                  <div className="flex gap-1.5 mr-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                  </div>
                  
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                      <Sparkles className="w-5 h-5 text-sky-200" />
                    </div>
                    {/* Breathing dot */}
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900 animate-pulse" />
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-base">Plexa AI</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-extrabold uppercase tracking-wide">
                        Agent
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active school analyst
                    </span>
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleAutoplay}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-300 ${
                      isAutoplayActive
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                        : "bg-blue-600 hover:bg-blue-500 text-white border-transparent shadow-lg shadow-blue-600/20"
                    }`}
                  >
                    {isAutoplayActive ? (
                      <>
                        <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                          <rect x="4" y="4" width="16" height="16" rx="2" />
                        </svg>
                        <span>Pause Demo</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        <span>Autoplay Demo</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleReset}
                    title="Reset Chat"
                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                      <path d="M3 3v5h5" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Chat Messages List */}
              <div className="h-[360px] overflow-y-auto px-6 py-6 space-y-4 bg-slate-950/40 scrollbar-thin scrollbar-thumb-slate-800">
                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3.5 text-sm leading-relaxed shadow-lg ${
                          msg.sender === "user"
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none font-medium"
                            : "bg-slate-900 border border-slate-800/80 text-slate-200 rounded-tl-none"
                        }`}
                      >
                        {msg.sender === "user" ? (
                          msg.text
                        ) : (
                          <div className="space-y-1">
                            {formatMessageText(msg.text)}
                          </div>
                        )}
                        <span
                          className={`text-[9px] block mt-1.5 ${
                            msg.sender === "user" ? "text-blue-200/80 text-right" : "text-slate-500"
                          }`}
                        >
                          {msg.timestamp}
                        </span>
                      </div>
                    </motion.div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex justify-start"
                    >
                      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl rounded-tl-none px-4 py-3 text-slate-400 flex items-center gap-1.5 shadow-lg">
                        <span className="text-xs font-semibold text-slate-400">Plexa is typing</span>
                        <div className="flex gap-1 items-center mt-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={chatEndRef} />
              </div>

              {/* Quick Actions / Suggested Chips */}
              <div className="px-6 py-3.5 bg-slate-950/80 border-t border-slate-800/60 overflow-x-auto whitespace-nowrap flex gap-2.5 items-center scrollbar-none">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide shrink-0">Try asking:</span>
                {[
                  { text: "How many classes?", question: "how many classes in my school?", role: "Admin" as const, color: "hover:border-emerald-500/50 hover:bg-emerald-500/5" },
                  { text: "Total Students?", question: "how many student in my school", role: "Admin" as const, color: "hover:border-blue-500/50 hover:bg-blue-500/5" },
                  { text: "Today's Attendance?", question: "what is today's attendance summary", role: "Teacher" as const, color: "hover:border-purple-500/50 hover:bg-purple-500/5" },
                  { text: "Predict Collections?", question: "predict next month's fee collection", role: "Finance" as const, color: "hover:border-amber-500/50 hover:bg-amber-500/5" }
                ].map((chip, i) => (
                  <button
                    key={i}
                    disabled={isAutoplayActive}
                    onClick={() => handleChipClick(chip.question, chip.role)}
                    className={`px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 transition-all duration-300 ${chip.color} shrink-0 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {chip.text}
                  </button>
                ))}
              </div>

              {/* Input Area */}
              <div className="p-4 bg-slate-950 border-t border-slate-800/80">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex gap-2.5 items-center"
                >
                  <div className="relative flex-grow">
                    <input
                      type="text"
                      disabled={isAutoplayActive}
                      value={inputVal}
                      onChange={(e) => setInputVal(e.target.value)}
                      placeholder={isAutoplayActive ? "Autoplay typing demo active..." : "Ask Plexa: e.g. how many classes..."}
                      className="w-full bg-slate-900 border border-slate-800/80 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/30 transition-all disabled:opacity-60"
                    />
                    
                    {/* Simulated Voice Mic Icon */}
                    <button
                      type="button"
                      disabled={isAutoplayActive}
                      title="Microphone (Voice Mode)"
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-400 p-1 rounded-md transition-colors disabled:opacity-50"
                    >
                      <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2">
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                        <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                        <line x1="12" x2="12" y1="19" y2="22" />
                      </svg>
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isAutoplayActive || !inputVal.trim()}
                    className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/10 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4 fill-none stroke-current rotate-45" viewBox="0 0 24 24" strokeWidth="2.5">
                      <line x1="22" x2="11" y1="2" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </form>
                
                {/* Active Role Dashboard Footer */}
                <div className="flex items-center justify-between mt-3 px-1 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-indigo-500/80 animate-ping" />
                    <span>Database: **Connected (PostgreSQL)**</span>
                  </div>
                  <div className="flex items-center gap-1 font-medium">
                    <span>Active Session:</span>
                    <span className="text-slate-300 font-semibold">{activeRole} Command Panel</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};
