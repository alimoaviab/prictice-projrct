import React from "react";
import { motion } from "framer-motion";
import { BrainCircuit, Sparkles, TrendingUp, AlertTriangle } from "lucide-react";

export const AISystemSection = () => {
  return (
    <section className="py-32 bg-slate-950 relative overflow-hidden">
      {/* Background Neural Network Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent opacity-50 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left Content */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold mb-6"
            >
              <BrainCircuit className="w-4 h-4" />
              <span>Eduplexo Intelligence</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight"
            >
              An infrastructure that <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                thinks with you.
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: 0.2 }}
              className="text-lg text-slate-400 mb-10 leading-relaxed font-medium"
            >
              Move beyond basic automation. Our built-in AI analyzes attendance patterns, predicts fee defaults, and recommends academic interventions before problems occur.
            </motion.p>

            <div className="space-y-6">
              {[
                { icon: TrendingUp, title: "Performance Prediction", desc: "Identify students at risk of falling behind before exams.", color: "text-emerald-400" },
                { icon: AlertTriangle, title: "Smart Anomaly Detection", desc: "Get alerted to unusual attendance drops or fee collection delays.", color: "text-amber-400" },
                { icon: Sparkles, title: "Automated Reporting", desc: "Let AI draft personalized parent-teacher meeting notes.", color: "text-purple-400" }
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: 0.3 + (idx * 0.1) }}
                  className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className={`mt-1 ${item.color}`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">{item.title}</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Visual: Abstract AI Brain / Neural Nodes */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8 }}
            className="relative h-[500px] flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/20 to-indigo-900/20 rounded-full blur-[80px]" />

            {/* SVG Neural Lines */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 500">
               {[
                 [100, 100, 250, 250],
                 [400, 150, 250, 250],
                 [150, 400, 250, 250],
                 [350, 380, 250, 250],
                 [80, 250, 250, 250],
                 [420, 280, 250, 250]
               ].map((coords, i) => (
                 <motion.line
                   key={i}
                   x1={coords[0]} y1={coords[1]} x2={coords[2]} y2={coords[3]}
                   stroke="rgba(96, 165, 250, 0.2)"
                   strokeWidth="2"
                   initial={{ pathLength: 0 }}
                   whileInView={{ pathLength: 1 }}
                   viewport={{ once: true }}
                   transition={{ duration: 1.5, delay: i * 0.2 }}
                 />
               ))}

               {/* Center Node */}
               <circle cx="250" cy="250" r="40" fill="rgba(59, 130, 246, 0.1)" stroke="rgba(59, 130, 246, 0.5)" strokeWidth="2" />
               <motion.circle
                 cx="250" cy="250" r="20"
                 fill="#3b82f6"
                 animate={{ opacity: [0.5, 1, 0.5], scale: [0.9, 1.1, 0.9] }}
                 transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
               />

               {/* Outer Nodes */}
               {[
                 [100, 100], [400, 150], [150, 400], [350, 380], [80, 250], [420, 280]
               ].map((pos, i) => (
                 <motion.circle
                   key={`node-${i}`}
                   cx={pos[0]} cy={pos[1]} r="8"
                   fill="#60a5fa"
                   animate={{ opacity: [0.3, 1, 0.3] }}
                   transition={{ duration: 1.5, delay: i * 0.3, repeat: Infinity, ease: "easeInOut" }}
                 />
               ))}
            </svg>

            {/* Floating Info Cards */}
            <motion.div
               animate={{ y: [0, -10, 0] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               className="absolute top-10 right-10 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl shadow-2xl"
            >
               <div className="text-xs text-blue-300 font-medium mb-1">Prediction Model</div>
               <div className="text-white text-sm font-bold">94% Accuracy</div>
            </motion.div>

            <motion.div
               animate={{ y: [0, 10, 0] }}
               transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
               className="absolute bottom-20 left-10 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl shadow-2xl"
            >
               <div className="text-xs text-emerald-300 font-medium mb-1">System Health</div>
               <div className="text-white text-sm font-bold">Optimized</div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
