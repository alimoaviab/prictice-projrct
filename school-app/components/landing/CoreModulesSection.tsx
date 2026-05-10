"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Banknote, Bus, Building, BookMarked, Wallet, Network } from "lucide-react";

export const CoreModulesSection = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const modules = [
    { id: "fee", title: "Fee Management", icon: Banknote, color: "bg-emerald-500", desc: "Automated billing, online payments, and instant receipt generation." },
    { id: "transport", title: "Transport Tracking", icon: Bus, color: "bg-amber-500", desc: "Real-time GPS tracking, route management, and driver allocation." },
    { id: "hostel", title: "Hostel Management", icon: Building, color: "bg-purple-500", desc: "Room allocation, attendance tracking, and visitor management." },
    { id: "library", title: "Library Management", icon: BookMarked, color: "bg-blue-500", desc: "Digital cataloging, automated issue/return, and fine calculation." },
    { id: "payroll", title: "Staff Payroll", icon: Wallet, color: "bg-rose-500", desc: "Automated salary processing, tax calculations, and payslip generation." },
    { id: "branch", title: "Multi-Branch Control", icon: Network, color: "bg-indigo-500", desc: "Centralized control for institutions with multiple campuses." },
  ];

  return (
    <section ref={containerRef} className="py-32 bg-slate-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight"
          >
            A comprehensive <span className="text-blue-600">ecosystem</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-slate-600"
          >
            Everything you need to run your institution, integrated into one seamless platform.
          </motion.p>
        </div>

        <div className="relative h-[600px] md:h-[500px] w-full max-w-5xl mx-auto border border-slate-200/50 rounded-[3rem] bg-white shadow-xl overflow-hidden">
           {/* Connecting lines background */}
           <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                 <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" className="text-slate-300" strokeWidth="1"/>
                 </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
           </svg>

           {/* Draggable module cards */}
           <div className="absolute inset-0 p-8 flex flex-wrap justify-center items-center gap-6">
             {modules.map((mod, i) => (
                <motion.div
                  key={mod.id}
                  drag
                  dragConstraints={{ left: -200, right: 200, top: -200, bottom: 200 }}
                  dragElastic={0.2}
                  whileDrag={{ scale: 1.1, zIndex: 50, cursor: "grabbing" }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="w-64 bg-white rounded-2xl border border-slate-200 shadow-lg p-5 cursor-grab relative group z-10"
                >
                   <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-slate-50 to-white -z-10" />
                   <div className={`w-12 h-12 rounded-xl ${mod.color} flex items-center justify-center text-white mb-4 shadow-md`}>
                      <mod.icon className="w-6 h-6" />
                   </div>
                   <h3 className="text-lg font-bold text-slate-900 mb-2">{mod.title}</h3>
                   <p className="text-sm text-slate-500 leading-relaxed group-hover:text-slate-700 transition-colors">
                      {mod.desc}
                   </p>
                </motion.div>
             ))}
           </div>

           <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/5 backdrop-blur-md px-6 py-2 rounded-full border border-slate-200/50 text-sm font-medium text-slate-500 flex items-center gap-2 pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Try dragging the modules
           </div>
        </div>
      </div>
    </section>
  );
};
