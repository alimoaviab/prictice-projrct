"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Sparkles, BrainCircuit, TrendingUp, AlertTriangle } from "lucide-react";

export const AiFeaturesSection = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 50]);

  return (
    <section ref={containerRef} className="py-32 bg-slate-900 relative overflow-hidden">
      {/* Dark Futuristic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />

        {/* Animated grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold mb-6 backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4" />
            Powered by EduAI
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight"
          >
            Predictive intelligence for proactive leadership
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-400"
          >
            Move beyond data storage. Our AI analyzes patterns to predict student outcomes, financial trends, and operational bottlenecks.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Card 1 */}
          <motion.div
            style={{ y: y1 }}
            className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-8 backdrop-blur-md relative overflow-hidden group hover:border-blue-500/50 transition-colors"
          >
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-6 text-blue-400">
                <TrendingUp className="w-6 h-6" />
             </div>
             <h3 className="text-xl font-bold text-white mb-3">Performance Prediction</h3>
             <p className="text-slate-400 leading-relaxed mb-6">
                Identifies students at risk of falling behind before it happens, allowing for early intervention.
             </p>
             {/* Mini visualization */}
             <div className="h-24 bg-slate-900/50 rounded-xl border border-slate-700/50 p-4 flex items-end gap-2">
                {[40, 50, 45, 60, 75, 85].map((h, i) => (
                   <motion.div
                     key={i}
                     initial={{ height: 0 }}
                     whileInView={{ height: `${h}%` }}
                     transition={{ duration: 1, delay: i * 0.1 }}
                     className={`flex-1 rounded-t-sm ${i > 3 ? 'bg-blue-500' : 'bg-slate-600'}`}
                   />
                ))}
             </div>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-8 backdrop-blur-md relative overflow-hidden group hover:border-purple-500/50 transition-colors mt-8 lg:mt-0"
          >
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-6 text-purple-400">
                <BrainCircuit className="w-6 h-6" />
             </div>
             <h3 className="text-xl font-bold text-white mb-3">Smart Scheduling</h3>
             <p className="text-slate-400 leading-relaxed mb-6">
                AI algorithms generate optimal timetables, preventing conflicts and maximizing teacher availability.
             </p>
             {/* Mini visualization */}
             <div className="h-24 bg-slate-900/50 rounded-xl border border-slate-700/50 p-3 grid grid-cols-4 grid-rows-3 gap-1">
                {[...Array(12)].map((_, i) => (
                   <motion.div
                     key={i}
                     initial={{ opacity: 0 }}
                     whileInView={{ opacity: 1 }}
                     transition={{ duration: 0.5, delay: Math.random() }}
                     className={`rounded-sm ${Math.random() > 0.7 ? 'bg-purple-500/50' : 'bg-slate-700/50'}`}
                   />
                ))}
             </div>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            style={{ y: y2 }}
            className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-8 backdrop-blur-md relative overflow-hidden group hover:border-amber-500/50 transition-colors mt-8 lg:mt-0"
          >
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-6 text-amber-400">
                <AlertTriangle className="w-6 h-6" />
             </div>
             <h3 className="text-xl font-bold text-white mb-3">Fee Defaulter Prediction</h3>
             <p className="text-slate-400 leading-relaxed mb-6">
                Analyzes payment history to predict potential delays, enabling automated, gentle reminders.
             </p>
             {/* Mini visualization */}
             <div className="h-24 bg-slate-900/50 rounded-xl border border-slate-700/50 p-4 flex flex-col justify-center gap-3">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700" />
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                       <motion.div initial={{ width: 0 }} whileInView={{ width: '80%' }} className="h-full bg-amber-500" />
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700" />
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                       <motion.div initial={{ width: 0 }} whileInView={{ width: '30%' }} className="h-full bg-emerald-500" />
                    </div>
                 </div>
             </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
