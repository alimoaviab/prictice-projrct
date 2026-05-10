"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Play, ShieldCheck, Zap, BarChart3, Users, BookOpen } from "lucide-react";
import Link from "next/link";

export const HeroSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section ref={containerRef} className="relative min-h-screen pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-[#FAFAFA]">
      {/* Background elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[120px] mix-blend-multiply" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/20 blur-[120px] mix-blend-multiply" />

        {/* Animated grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-5xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200/60 shadow-sm text-slate-800 text-sm font-semibold mb-8 backdrop-blur-md"
          >
            <span className="flex h-2 w-2 rounded-full bg-blue-500" />
            EduManage 2.0 is now live
            <Link href="#updates" className="text-blue-600 hover:text-blue-700 ml-2 flex items-center gap-1">
              See what's new <ArrowRight className="w-3 h-3" />
            </Link>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
            className="text-6xl md:text-8xl font-bold tracking-tighter text-slate-900 mb-8 leading-[1.05]"
          >
            The operating system for <br className="hidden md:block" />
            <span className="relative">
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                modern education
              </span>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="text-xl md:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed font-medium"
          >
            Unify administration, engage parents, and empower teachers with an intelligent ecosystem designed for scale.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/auth/login"
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-full font-semibold text-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-slate-800 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgb(0,0,0,0.16)] transition-all flex items-center justify-center gap-2"
            >
              Start Free Trial <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#demo"
              className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 rounded-full font-semibold text-lg shadow-sm border border-slate-200 hover:bg-slate-50 hover:-translate-y-1 hover:shadow-md transition-all flex items-center justify-center gap-2 group"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Play className="w-4 h-4 text-blue-600 ml-0.5" />
              </div>
              Watch Demo
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-8 text-sm font-medium text-slate-500"
          >
            <span className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-500" /> Enterprise Security</span>
            <span className="flex items-center gap-2"><Zap className="w-5 h-5 text-amber-500" /> Lightning Fast</span>
            <span className="flex items-center gap-2"><Users className="w-5 h-5 text-blue-500" /> 1M+ Users</span>
          </motion.div>
        </div>

        {/* 3D Dashboard Preview */}
        <motion.div
          style={{ y, opacity }}
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative max-w-6xl mx-auto perspective-1000"
        >
          {/* Decorative glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-gradient-to-tr from-blue-500/20 to-purple-500/20 blur-[100px] -z-10" />

          <div className="relative rounded-[2.5rem] bg-slate-900/5 p-2 ring-1 ring-white/10 shadow-2xl backdrop-blur-3xl transform rotate-x-12 scale-105 hover:rotate-x-0 hover:scale-100 transition-all duration-700 ease-out">
            <div className="rounded-[2rem] bg-white border border-slate-200/50 shadow-2xl overflow-hidden">
              {/* Browser Header */}
              <div className="h-14 border-b border-slate-100 bg-slate-50/80 flex items-center px-6 gap-3 backdrop-blur-md">
                <div className="flex gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#FF5F56]" />
                  <div className="w-3.5 h-3.5 rounded-full bg-[#FFBD2E]" />
                  <div className="w-3.5 h-3.5 rounded-full bg-[#27C93F]" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-white border border-slate-200 rounded-md px-32 py-1.5 text-xs text-slate-400 shadow-sm flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    edumanage.app
                  </div>
                </div>
              </div>

              {/* Dashboard Content Mock */}
              <div className="aspect-[16/9] bg-slate-50 relative p-6">
                <div className="grid grid-cols-12 gap-6 h-full">
                  {/* Sidebar */}
                  <div className="col-span-2 h-full bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col gap-6">
                    <div className="flex items-center gap-2 px-2">
                       <div className="w-8 h-8 rounded-lg bg-blue-600" />
                       <div className="h-4 w-16 bg-slate-200 rounded" />
                    </div>
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className={`flex gap-3 items-center p-2 rounded-lg ${i === 1 ? 'bg-blue-50' : ''}`}>
                          <div className={`w-5 h-5 rounded ${i === 1 ? 'bg-blue-600' : 'bg-slate-200'}`} />
                          <div className={`h-3 w-16 rounded ${i === 1 ? 'bg-blue-600' : 'bg-slate-200'}`} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="col-span-10 flex flex-col gap-6 h-full">
                    {/* Header */}
                    <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="h-6 w-48 bg-slate-200 rounded" />
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-slate-100" />
                        <div className="w-8 h-8 rounded-full bg-slate-100" />
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500" />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-6">
                      {[
                        { color: "bg-blue-500" },
                        { color: "bg-emerald-500" },
                        { color: "bg-amber-500" },
                        { color: "bg-purple-500" }
                      ].map((stat, i) => (
                        <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                          <div className="flex justify-between items-center">
                            <div className="h-4 w-20 bg-slate-100 rounded" />
                            <div className={`w-8 h-8 rounded-lg ${stat.color} opacity-20`} />
                          </div>
                          <div className="h-8 w-24 bg-slate-200 rounded" />
                        </div>
                      ))}
                    </div>

                    {/* Charts Area */}
                    <div className="flex-1 grid grid-cols-3 gap-6 min-h-0">
                       <div className="col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
                          <div className="h-5 w-32 bg-slate-200 rounded" />
                          <div className="flex-1 bg-slate-50 rounded-xl relative overflow-hidden">
                             <svg className="absolute bottom-0 w-full h-full text-blue-100" preserveAspectRatio="none" viewBox="0 0 100 100">
                                <path d="M0,100 L0,50 Q25,30 50,60 T100,40 L100,100 Z" fill="currentColor"/>
                             </svg>
                             <svg className="absolute bottom-0 w-full h-full text-blue-500" preserveAspectRatio="none" viewBox="0 0 100 100" style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 2 }}>
                                <path d="M0,50 Q25,30 50,60 T100,40" />
                             </svg>
                          </div>
                       </div>
                       <div className="col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
                          <div className="h-5 w-24 bg-slate-200 rounded" />
                          <div className="flex-1 flex flex-col gap-3">
                             {[1,2,3,4].map(i => (
                               <div key={i} className="flex-1 bg-slate-50 rounded-lg flex items-center p-3 gap-3">
                                  <div className="w-10 h-10 rounded-full bg-slate-200" />
                                  <div className="flex flex-col gap-2 flex-1">
                                     <div className="h-3 w-full bg-slate-200 rounded" />
                                     <div className="h-2 w-2/3 bg-slate-100 rounded" />
                                  </div>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements (Motion) */}
            <motion.div
               animate={{ y: [0, -10, 0] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               className="absolute -right-12 top-20 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-4 backdrop-blur-md"
            >
               <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-green-600" />
               </div>
               <div>
                  <div className="text-sm font-semibold text-slate-800">Attendance up</div>
                  <div className="text-xs text-slate-500">+12% this week</div>
               </div>
            </motion.div>

            <motion.div
               animate={{ y: [0, 15, 0] }}
               transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
               className="absolute -left-12 bottom-32 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-4 backdrop-blur-md"
            >
               <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-purple-600" />
               </div>
               <div>
                  <div className="text-sm font-semibold text-slate-800">Syllabus synced</div>
                  <div className="text-xs text-slate-500">Just now</div>
               </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
