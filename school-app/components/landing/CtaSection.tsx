"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Calendar, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";

export const CtaSection = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <section ref={containerRef} className="py-32 relative overflow-hidden bg-slate-900">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-gradient-to-tr from-blue-600/20 via-indigo-500/20 to-purple-600/20 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />

        {/* Animated Particles (Simplified CSS animation for performance) */}
        <div className="absolute inset-0 opacity-30">
          {[...Array(20)].map((_, i) => (
             <div
               key={i}
               className="absolute rounded-full bg-white animate-pulse"
               style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  width: `${Math.random() * 4 + 1}px`,
                  height: `${Math.random() * 4 + 1}px`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${Math.random() * 3 + 2}s`
               }}
             />
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <motion.div
          style={{ y }}
          className="bg-slate-800/40 border border-slate-700/50 rounded-[3rem] p-10 md:p-20 text-center backdrop-blur-xl shadow-2xl relative overflow-hidden"
        >
          {/* Edge highlights */}
          <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50" />
          <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-50" />

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight leading-tight"
          >
            Ready to upgrade your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              entire institution?
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl md:text-2xl text-slate-400 mb-12 max-w-2xl mx-auto"
          >
            Join 500+ innovative schools that have completely transformed their administration, communication, and analytics.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link
              href="#demo"
              className="w-full sm:w-auto px-10 py-5 bg-white text-slate-900 rounded-full font-bold text-lg shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] transition-all flex items-center justify-center gap-3 group"
            >
              <Calendar className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
              Schedule a Demo
            </Link>
            <Link
              href="/auth/login"
              className="w-full sm:w-auto px-10 py-5 bg-slate-800 text-white border border-slate-700 rounded-full font-bold text-lg hover:bg-slate-700 hover:border-slate-600 transition-all flex items-center justify-center gap-3"
            >
              Start Free Trial <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm font-medium text-slate-400"
          >
            <div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-400" /> No credit card required</div>
            <div className="flex items-center gap-2"><Zap className="w-5 h-5 text-amber-400" /> Setup in 48 hours</div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
