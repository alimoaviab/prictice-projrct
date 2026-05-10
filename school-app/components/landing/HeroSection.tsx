"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Play, ShieldCheck, Zap, BarChart3, Users, CreditCard, Sparkles } from "lucide-react";
import Link from "next/link";

export const HeroSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Subtle 3D rotation based on scroll
  const rotateX = useTransform(scrollYProgress, [0, 1], [10, 0]);
  const rotateY = useTransform(scrollYProgress, [0, 1], [-10, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={containerRef} className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden bg-slate-50">
      {/* Optimized Background (No heavy blur stacking) */}
      <div className="absolute inset-0 z-0 bg-[#F5F7FB]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[600px] opacity-20 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-300 via-transparent to-transparent" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-4xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-blue-100 shadow-sm text-blue-600 text-sm font-semibold mb-8"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>AI-Powered Enterprise Platform</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1]"
          >
            Manage your school with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              intelligent precision.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed font-medium"
          >
            An enterprise-grade ERP ecosystem built to automate operations, empower educators, and deliver real-time insights with Apple-level polish.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/auth/login"
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-full font-semibold shadow-xl hover:bg-slate-800 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-2"
            >
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="#demo"
              className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 rounded-full font-semibold shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 border border-slate-200"
            >
              <Play className="w-4 h-4 fill-current" /> Watch Preview
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-10 flex items-center justify-center gap-8 text-sm font-medium text-slate-600"
          >
            <span className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-500" /> Bank-grade Security</span>
            <span className="hidden sm:flex items-center gap-2"><Zap className="w-5 h-5 text-amber-500" /> Lightning Fast</span>
          </motion.div>
        </div>

        {/* 3D Cinematic Showcase */}
        <motion.div
          style={{ perspective: 2000 }}
          className="relative max-w-6xl mx-auto"
        >
          <motion.div
            style={{
              rotateX,
              rotateY,
              scale,
              opacity,
              transformStyle: "preserve-3d"
            }}
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, type: "spring", bounce: 0.3 }}
            className="relative z-10"
          >
            {/* Main Dashboard Panel */}
            <div className="relative rounded-[2rem] bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl overflow-hidden ring-1 ring-slate-900/5">
              {/* Browser Header Fake */}
              <div className="h-14 border-b border-slate-200/50 bg-white/50 flex items-center px-6 gap-2">
                <div className="flex gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-red-400/90 shadow-sm" />
                  <div className="w-3.5 h-3.5 rounded-full bg-amber-400/90 shadow-sm" />
                  <div className="w-3.5 h-3.5 rounded-full bg-green-400/90 shadow-sm" />
                </div>
                <div className="mx-auto bg-white/60 text-slate-400 text-xs font-medium px-4 py-1.5 rounded-full border border-slate-200/50 shadow-sm">
                  edumanage.enterprise.app
                </div>
              </div>

              {/* Dashboard Grid Mockup */}
              <div className="aspect-[16/10] bg-slate-50/50 p-8">
                <div className="grid grid-cols-12 gap-8 h-full">
                  {/* Sidebar */}
                  <div className="col-span-3 h-full bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm hidden md:flex flex-col gap-6">
                    <div className="h-8 w-32 bg-slate-100 rounded-lg" />
                    <div className="space-y-3 mt-4">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="flex gap-4 items-center p-2 rounded-lg bg-slate-50/50">
                          <div className="w-6 h-6 rounded-md bg-slate-200/80" />
                          <div className="h-4 w-24 bg-slate-100 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Main Area */}
                  <div className="col-span-12 md:col-span-9 flex flex-col gap-6">
                    {/* Top Row Stats */}
                    <div className="grid grid-cols-3 gap-6">
                      {[
                        { icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
                        { icon: CreditCard, color: "text-emerald-500", bg: "bg-emerald-50" },
                        { icon: BarChart3, color: "text-indigo-500", bg: "bg-indigo-50" }
                      ].map((stat, i) => (
                        <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col gap-4">
                          <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                          </div>
                          <div>
                            <div className="h-4 w-16 bg-slate-100 rounded mb-2" />
                            <div className="h-8 w-24 bg-slate-100 rounded" />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Chart Area */}
                    <div className="flex-1 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 relative overflow-hidden flex flex-col">
                       <div className="h-6 w-48 bg-slate-100 rounded mb-6" />
                       <div className="flex-1 relative">
                          {/* Grid lines */}
                          <div className="absolute inset-0 flex flex-col justify-between">
                             {[1,2,3,4,5].map(i => <div key={i} className="w-full h-px bg-slate-50" />)}
                          </div>
                          {/* Mock Chart Area */}
                          <div className="absolute bottom-0 w-full h-[80%] bg-gradient-to-t from-blue-50/80 to-transparent rounded-t-xl" />
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Interactive Enterprise Widgets */}
            {/* Widget 1: AI Assistant */}
            <motion.div
              drag
              dragConstraints={containerRef}
              dragElastic={0.1}
              whileHover={{ scale: 1.05 }}
              whileDrag={{ scale: 1.1, cursor: "grabbing" }}
              className="absolute -top-12 -right-8 z-30 cursor-grab hidden lg:block"
              style={{ z: 100 }}
            >
              <div className="backdrop-blur-xl bg-white/80 p-4 rounded-2xl border border-white/40 shadow-2xl w-64 ring-1 ring-slate-900/5">
                <div className="flex items-center gap-3 mb-3">
                   <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                      <Sparkles className="w-5 h-5 text-white" />
                   </div>
                   <div>
                     <div className="text-sm font-bold text-slate-900">AI Insight</div>
                     <div className="text-xs text-slate-500 font-medium">Real-time analysis</div>
                   </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-sm text-slate-600 border border-slate-100">
                  "Attendance in Grade 10-A is below average today. Send automated notice to parents?"
                </div>
                <div className="mt-3 flex gap-2">
                   <div className="flex-1 py-1.5 bg-blue-600 text-white text-xs text-center rounded-lg font-medium">Approve</div>
                   <div className="flex-1 py-1.5 bg-white text-slate-600 border border-slate-200 text-xs text-center rounded-lg font-medium">Dismiss</div>
                </div>
              </div>
            </motion.div>

            {/* Widget 2: Live Attendance */}
            <motion.div
              drag
              dragConstraints={containerRef}
              dragElastic={0.1}
              whileHover={{ scale: 1.05 }}
              whileDrag={{ scale: 1.1, cursor: "grabbing" }}
              className="absolute -bottom-8 -left-12 z-30 cursor-grab hidden lg:block"
              style={{ z: 120 }}
            >
              <div className="backdrop-blur-xl bg-white/90 p-5 rounded-2xl border border-white/40 shadow-2xl w-56 ring-1 ring-slate-900/5">
                 <div className="flex justify-between items-center mb-4">
                    <div className="text-sm font-bold text-slate-900">Live Campus Status</div>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                 </div>
                 <div className="space-y-4">
                    <div>
                       <div className="flex justify-between text-xs font-medium text-slate-500 mb-1">
                         <span>Students Present</span>
                         <span className="text-slate-900 font-bold">1,248 / 1,300</span>
                       </div>
                       <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="w-[96%] h-full bg-green-500 rounded-full" />
                       </div>
                    </div>
                    <div>
                       <div className="flex justify-between text-xs font-medium text-slate-500 mb-1">
                         <span>Staff Present</span>
                         <span className="text-slate-900 font-bold">112 / 115</span>
                       </div>
                       <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="w-[98%] h-full bg-blue-500 rounded-full" />
                       </div>
                    </div>
                 </div>
              </div>
            </motion.div>

          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
