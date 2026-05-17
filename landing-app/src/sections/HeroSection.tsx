import React, { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { ArrowRight, Play, ShieldCheck, Zap, BarChart3, Users, CreditCard, Sparkles } from "@/components/icons";
import { LOGIN_URL } from "@/lib/config";
import { whatsappUrl, WhatsappMessages } from "@/lib/whatsapp";

export const HeroSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track scroll progress of the hero section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Apply spring physics for smoother, luxurious transitions
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 50,
    damping: 20,
    restDelta: 0.001
  });

  // 3D Parallax & Spatial Transforms
  const heroTextY = useTransform(smoothProgress, [0, 1], ["0%", "50%"]);
  const heroTextOpacity = useTransform(smoothProgress, [0, 0.4], [1, 0]);
  
  // Make the dashboard mockup zoom out, rotate up, and fade as you scroll down
  const rotateX = useTransform(smoothProgress, [0, 0.5, 1], [15, 0, -10]);
  const rotateY = useTransform(smoothProgress, [0, 0.5, 1], [-15, 0, 10]);
  const scale = useTransform(smoothProgress, [0, 0.5, 1], [0.9, 1.05, 0.85]);
  const zIndex = useTransform(smoothProgress, [0, 0.5], [10, 0]);
  const mockupY = useTransform(smoothProgress, [0, 1], ["0%", "-30%"]);
  const opacity = useTransform(smoothProgress, [0, 0.8, 1], [1, 1, 0]);

  // Floating elements parallax
  const floatWidget1Y = useTransform(smoothProgress, [0, 1], ["0%", "-100%"]);
  const floatWidget2Y = useTransform(smoothProgress, [0, 1], ["0%", "80%"]);

  return (
    <section ref={containerRef} className="relative h-[150vh] bg-slate-50">
      {/* Sticky Container for the storytelling experience */}
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col pt-32 md:pt-40">
        
        {/* Deep Background Layers */}
        <div className="absolute inset-0 z-0 bg-[#F5F7FB]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150vw] max-w-[2000px] h-[800px] opacity-30 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-200 via-transparent to-transparent" />
        
        {/* Ambient Grid for depth */}
        <div className="absolute inset-0 z-0 opacity-[0.03]" 
             style={{ backgroundImage: "linear-gradient(#1D4ED8 1px, transparent 1px), linear-gradient(90deg, #1D4ED8 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
          
          {/* Foreground: Hero Content */}
          <motion.div 
            style={{ y: heroTextY, opacity: heroTextOpacity }}
            className="text-center max-w-4xl mx-auto mb-16 relative z-20"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md border border-blue-100 shadow-[0_4px_20px_rgba(37,99,235,0.05)] text-blue-600 text-sm font-semibold mb-8"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>AI-Powered Enterprise Platform</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1] drop-shadow-sm"
            >
              Manage your school with{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                intelligent precision.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed font-medium"
            >
              An enterprise-grade ERP ecosystem built to automate operations, empower educators, and deliver real-time insights with cinematic polish.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <a
                href={whatsappUrl(WhatsappMessages.freeTrial())}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-full font-semibold shadow-[0_8px_30px_rgba(37,99,235,0.24)] hover:bg-blue-700 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(37,99,235,0.32)] transition-all duration-300 flex items-center justify-center gap-2"
              >
                Start Free Trial <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href={whatsappUrl(WhatsappMessages.bookDemo())}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 bg-white/80 backdrop-blur-sm text-slate-900 rounded-full font-semibold shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 border border-slate-200/60"
              >
                <Play className="w-4 h-4 fill-current" /> Watch Preview
              </a>
            </motion.div>
          </motion.div>

          {/* Midground: 3D Cinematic Showcase */}
          <motion.div
            style={{ perspective: 2000, y: mockupY, zIndex, opacity }}
            className="relative max-w-6xl mx-auto"
          >
            <motion.div
              style={{
                rotateX,
                rotateY,
                scale,
                transformStyle: "preserve-3d"
              }}
              initial={{ opacity: 0, y: 150, rotateX: 25, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, rotateX: 15, scale: 0.9 }}
              transition={{ duration: 1.5, delay: 0.4, type: "spring", bounce: 0.2 }}
              className="relative z-10"
            >
              {/* Main Dashboard Panel */}
              <div className="relative rounded-[2rem] bg-white/90 backdrop-blur-2xl border border-white shadow-[0_30px_100px_rgba(15,23,42,0.15)] overflow-hidden ring-1 ring-slate-900/5 transition-shadow">
                
                {/* 3D Glass Reflection Overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/40 pointer-events-none" style={{ transform: 'translateZ(1px)' }} />

                {/* Browser Header Fake */}
                <div className="h-14 border-b border-slate-200/50 bg-white/80 flex items-center px-6 gap-2">
                  <div className="flex gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-rose-400 shadow-sm" />
                    <div className="w-3.5 h-3.5 rounded-full bg-amber-400 shadow-sm" />
                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-sm" />
                  </div>
                  <div className="mx-auto bg-slate-50 text-slate-400 text-xs font-semibold px-6 py-1.5 rounded-full border border-slate-200/50 shadow-inner">
                    eduplexo.app
                  </div>
                </div>

                {/* Dashboard Grid Mockup */}
                <div className="aspect-[16/10] bg-slate-50/30 p-8 relative">
                  <div className="grid grid-cols-12 gap-8 h-full">
                    {/* Sidebar */}
                    <div className="col-span-3 h-full bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm hidden md:flex flex-col gap-6" style={{ transform: 'translateZ(10px)' }}>
                      <div className="h-8 w-32 bg-slate-100 rounded-lg" />
                      <div className="space-y-3 mt-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <div key={i} className="flex gap-4 items-center p-2 rounded-lg bg-slate-50/50 transition-colors hover:bg-slate-100">
                            <div className="w-6 h-6 rounded-md bg-slate-200/80" />
                            <div className="h-4 w-24 bg-slate-100 rounded" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Main Area */}
                    <div className="col-span-12 md:col-span-9 flex flex-col gap-6" style={{ transform: 'translateZ(20px)' }}>
                      {/* Top Row Stats */}
                      <div className="grid grid-cols-3 gap-6">
                        {[
                          { icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                          { icon: CreditCard, color: "text-emerald-600", bg: "bg-emerald-50" },
                          { icon: BarChart3, color: "text-indigo-600", bg: "bg-indigo-50" }
                        ].map((stat, i) => (
                          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col gap-4 hover:shadow-md hover:-translate-y-1 transition-all">
                            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                              <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <div>
                              <div className="h-4 w-16 bg-slate-100 rounded mb-2" />
                              <div className="h-8 w-24 bg-slate-200 rounded" />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Chart Area */}
                      <div className="flex-1 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 relative overflow-hidden flex flex-col hover:shadow-md transition-all">
                         <div className="h-6 w-48 bg-slate-100 rounded mb-6" />
                         <div className="flex-1 relative">
                            <div className="absolute inset-0 flex flex-col justify-between">
                               {[1,2,3,4,5].map(i => <div key={i} className="w-full h-px bg-slate-100" />)}
                            </div>
                            <div className="absolute bottom-0 w-full h-[80%] bg-gradient-to-t from-blue-50/80 to-transparent rounded-t-xl" />
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Foreground: Floating Interactive Enterprise Widgets */}
              
              {/* Widget 1: AI Assistant */}
              <motion.div
                style={{ y: floatWidget1Y, translateZ: 80 }}
                whileHover={{ scale: 1.05 }}
                className="absolute -top-12 -right-12 z-30 hidden lg:block"
              >
                <div className="backdrop-blur-xl bg-white/80 p-4 rounded-2xl border border-white/60 shadow-2xl w-72 ring-1 ring-slate-900/5">
                  <div className="flex items-center gap-3 mb-3">
                     <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                        <Sparkles className="w-5 h-5 text-white" />
                     </div>
                     <div>
                       <div className="text-sm font-bold text-slate-900">AI Insight</div>
                       <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Real-time analysis</div>
                     </div>
                  </div>
                  <div className="p-3 bg-slate-50/80 rounded-xl text-sm text-slate-600 border border-slate-100 shadow-inner">
                    "Attendance in Grade 10-A is below average today. Send automated notice to parents?"
                  </div>
                  <div className="mt-3 flex gap-2">
                     <button className="flex-1 py-2 bg-blue-600 text-white text-xs text-center rounded-lg font-bold shadow-md hover:bg-blue-700 transition-colors">Approve</button>
                     <button className="flex-1 py-2 bg-white text-slate-600 border border-slate-200 text-xs text-center rounded-lg font-bold hover:bg-slate-50 transition-colors">Dismiss</button>
                  </div>
                </div>
              </motion.div>

              {/* Widget 2: Live Attendance */}
              <motion.div
                style={{ y: floatWidget2Y, translateZ: 60 }}
                whileHover={{ scale: 1.05 }}
                className="absolute -bottom-16 -left-16 z-30 hidden lg:block"
              >
                <div className="backdrop-blur-xl bg-white/90 p-5 rounded-2xl border border-white/60 shadow-2xl w-64 ring-1 ring-slate-900/5">
                   <div className="flex justify-between items-center mb-4">
                      <div className="text-sm font-bold text-slate-900">Live Campus Status</div>
                      <div className="flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </div>
                   </div>
                   <div className="space-y-4">
                      <div>
                         <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                           <span>Students Present</span>
                           <span className="text-slate-900">1,248 / 1,300</span>
                         </div>
                         <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                            <div className="w-[96%] h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full" />
                         </div>
                      </div>
                      <div>
                         <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                           <span>Staff Present</span>
                           <span className="text-slate-900">112 / 115</span>
                         </div>
                         <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                            <div className="w-[98%] h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full" />
                         </div>
                      </div>
                   </div>
                </div>
              </motion.div>

            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
