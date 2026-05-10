"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Smartphone, Bell, Book, CreditCard, ChevronRight } from "lucide-react";
import Link from "next/link";

export const MobileExperienceSection = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [150, -50]);

  return (
    <section ref={containerRef} className="py-32 bg-[#F5F7FB] relative overflow-hidden">
      {/* Decorative background circle */}
      <div className="absolute top-1/2 left-[60%] -translate-y-1/2 w-[800px] h-[800px] bg-blue-100/50 rounded-full blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* Text Content */}
        <div className="relative z-10 max-w-xl">
           <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold mb-6"
          >
            <Smartphone className="w-4 h-4" />
            Native Parent App
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight"
          >
            Keep parents in the loop, <span className="text-blue-600">in real-time</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-600 mb-10"
          >
            Bridge the gap between home and school with our beautifully designed native app for iOS and Android.
          </motion.p>

          <div className="space-y-6 mb-10">
             {[
                { icon: Bell, title: "Instant Notifications", desc: "Push alerts for attendance, announcements, and emergencies.", color: "text-amber-500", bg: "bg-amber-100" },
                { icon: Book, title: "Academic Tracking", desc: "Live access to grades, assignments, and teacher feedback.", color: "text-blue-500", bg: "bg-blue-100" },
                { icon: CreditCard, title: "1-Click Fee Payments", desc: "Secure online payments directly from the app.", color: "text-emerald-500", bg: "bg-emerald-100" },
             ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + (i * 0.1) }}
                  className="flex items-start gap-4"
                >
                   <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center flex-shrink-0`}>
                      <feature.icon className={`w-6 h-6 ${feature.color}`} />
                   </div>
                   <div>
                      <h4 className="text-lg font-bold text-slate-900">{feature.title}</h4>
                      <p className="text-slate-600">{feature.desc}</p>
                   </div>
                </motion.div>
             ))}
          </div>

          <motion.div
             initial={{ opacity: 0 }}
             whileInView={{ opacity: 1 }}
             viewport={{ once: true }}
             transition={{ delay: 0.6 }}
          >
             <Link href="#" className="inline-flex items-center gap-2 text-blue-600 font-bold hover:text-blue-700 transition-colors group">
                Explore the parent app <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
             </Link>
          </motion.div>
        </div>

        {/* Floating Phones Mockup */}
        <div className="relative h-[600px] flex items-center justify-center pointer-events-none perspective-1000">

           {/* Phone 1 (Back) */}
           <motion.div
             style={{ y: y1 }}
             className="absolute right-10 top-10 w-64 h-[500px] bg-white rounded-[2.5rem] border-8 border-slate-800 shadow-2xl overflow-hidden transform rotate-6 scale-90 opacity-80"
           >
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-xl z-20" />
              {/* Screen Content */}
              <div className="bg-slate-50 w-full h-full p-4 pt-10">
                 <div className="flex justify-between items-center mb-6">
                    <div className="w-8 h-8 rounded-full bg-slate-200" />
                    <div className="w-6 h-6 rounded bg-slate-200" />
                 </div>
                 <div className="space-y-3">
                    {[1,2,3,4,5].map(i => (
                       <div key={i} className="bg-white p-3 rounded-xl shadow-sm flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50" />
                          <div className="flex-1 space-y-2">
                             <div className="h-2 w-full bg-slate-200 rounded" />
                             <div className="h-2 w-2/3 bg-slate-100 rounded" />
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </motion.div>

           {/* Phone 2 (Front) */}
           <motion.div
             style={{ y: y2 }}
             className="absolute left-10 bottom-10 w-[280px] h-[550px] bg-white rounded-[3rem] border-8 border-slate-900 shadow-[0_30px_60px_rgba(0,0,0,0.2)] overflow-hidden z-20"
           >
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-7 bg-slate-900 rounded-b-2xl z-20" />
              {/* Screen Content */}
              <div className="bg-gradient-to-b from-blue-50 to-white w-full h-full relative overflow-hidden">
                 {/* Header */}
                 <div className="bg-white px-5 pt-12 pb-4 shadow-sm relative z-10 flex justify-between items-center">
                    <div>
                       <div className="text-xs font-bold text-slate-400">Good morning</div>
                       <div className="text-lg font-bold text-slate-900">Sarah's Parent</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 border-2 border-white shadow-sm" />
                 </div>

                 <div className="p-5 space-y-5 relative z-10">
                    {/* ID Card */}
                    <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                       <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 rounded-full bg-white/20" />
                          <div>
                             <div className="font-bold">Sarah Jenkins</div>
                             <div className="text-xs text-white/70">Grade 8 • Section A</div>
                          </div>
                       </div>
                       <div className="flex justify-between items-end">
                          <div className="text-xs font-medium bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded">Present Today</div>
                          <div className="text-xs text-white/50">ID: 92834</div>
                       </div>
                    </div>

                    {/* Notification Popup Animation */}
                    <motion.div
                      animate={{ y: [20, 0, 0, 0, 20], opacity: [0, 1, 1, 1, 0] }}
                      transition={{ duration: 4, repeat: Infinity, times: [0, 0.1, 0.8, 0.9, 1] }}
                      className="bg-white p-4 rounded-xl shadow-lg border border-slate-100 flex gap-3 absolute top-32 left-5 right-5 z-30"
                    >
                       <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                          <Bell className="w-5 h-5" />
                       </div>
                       <div>
                          <div className="text-sm font-bold text-slate-900">Fee Reminder</div>
                          <div className="text-xs text-slate-500">Term 2 fees are due in 3 days.</div>
                       </div>
                    </motion.div>

                    {/* Grid */}
                    <div className="grid grid-cols-2 gap-3 mt-10">
                       <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600"><Book className="w-4 h-4"/></div>
                          <div className="text-sm font-bold text-slate-800">Homework</div>
                          <div className="text-xs text-slate-500">2 pending</div>
                       </div>
                       <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600"><CreditCard className="w-4 h-4"/></div>
                          <div className="text-sm font-bold text-slate-800">Payments</div>
                          <div className="text-xs text-slate-500">View receipts</div>
                       </div>
                    </div>
                 </div>
              </div>
           </motion.div>
        </div>
      </div>
    </section>
  );
};
