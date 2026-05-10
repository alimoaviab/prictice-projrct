"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, BarChart3, PieChart, Activity, Users, Calendar, BookOpen, GraduationCap } from "lucide-react";

export const DashboardShowcase = () => {
  const [activeTab, setActiveTab] = useState("analytics");

  const tabs = [
    { id: "analytics", label: "Real-time Analytics", icon: LineChart },
    { id: "attendance", label: "Attendance Intel", icon: Activity },
    { id: "academics", label: "Academic Performance", icon: GraduationCap },
    { id: "schedule", label: "Smart Scheduling", icon: Calendar },
  ];

  return (
    <section className="py-32 bg-slate-50 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-semibold mb-6"
          >
            <Activity className="w-4 h-4" />
            Live System Preview
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight"
          >
            A command center for your entire institution
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-600"
          >
            Experience data-driven decision making with our beautifully designed, interactive dashboards.
          </motion.p>
        </div>

        {/* Interactive Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white shadow-lg"
                  : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard Frame */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative mx-auto max-w-5xl"
        >
          {/* Glowing backdrop */}
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-2xl -z-10 rounded-[3rem]" />

          <div className="rounded-[2rem] bg-white border border-slate-200/60 shadow-2xl overflow-hidden backdrop-blur-xl">
            {/* Top Bar */}
            <div className="h-14 border-b border-slate-100 flex items-center justify-between px-6 bg-slate-50/50">
               <div className="flex gap-2">
                 <div className="w-3 h-3 rounded-full bg-slate-300" />
                 <div className="w-3 h-3 rounded-full bg-slate-300" />
                 <div className="w-3 h-3 rounded-full bg-slate-300" />
               </div>
               <div className="flex items-center gap-4">
                  <div className="h-6 w-32 bg-slate-200 rounded-md" />
                  <div className="w-8 h-8 rounded-full bg-blue-100" />
               </div>
            </div>

            {/* Dynamic Content Area */}
            <div className="p-8 bg-slate-50 min-h-[500px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  {activeTab === "analytics" && (
                    <div className="grid grid-cols-3 gap-6 h-full">
                      <div className="col-span-3 grid grid-cols-4 gap-6">
                         {[1,2,3,4].map(i => (
                           <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                             <div className="h-4 w-24 bg-slate-100 rounded mb-4" />
                             <div className="h-8 w-16 bg-slate-200 rounded mb-2" />
                             <div className="h-2 w-full bg-slate-50 rounded overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.random() * 60 + 30}%` }}
                                  transition={{ duration: 1, delay: 0.2 }}
                                  className="h-full bg-blue-500 rounded"
                                />
                             </div>
                           </div>
                         ))}
                      </div>
                      <div className="col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                         <div className="h-6 w-48 bg-slate-200 rounded mb-8" />
                         {/* Animated Chart Mock */}
                         <div className="h-48 flex items-end gap-2">
                            {[...Array(12)].map((_, i) => (
                              <motion.div
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${Math.random() * 80 + 20}%` }}
                                transition={{ duration: 1, delay: i * 0.1 }}
                                className="flex-1 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-md opacity-80"
                              />
                            ))}
                         </div>
                      </div>
                      <div className="col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                         <div className="h-6 w-32 bg-slate-200 rounded mb-8" />
                         <div className="space-y-4">
                            {[1,2,3,4].map(i => (
                              <div key={i} className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex-shrink-0" />
                                <div className="flex-1">
                                  <div className="h-4 w-full bg-slate-200 rounded mb-2" />
                                  <div className="h-3 w-2/3 bg-slate-100 rounded" />
                                </div>
                              </div>
                            ))}
                         </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "attendance" && (
                    <div className="flex items-center justify-center h-[400px] text-slate-400 font-medium">
                      <div className="flex flex-col items-center gap-4">
                         <Activity className="w-12 h-12 text-slate-300" />
                         Attendance Intelligence Module
                      </div>
                    </div>
                  )}

                  {activeTab === "academics" && (
                     <div className="flex items-center justify-center h-[400px] text-slate-400 font-medium">
                     <div className="flex flex-col items-center gap-4">
                        <GraduationCap className="w-12 h-12 text-slate-300" />
                        Academic Performance Module
                     </div>
                   </div>
                  )}

                  {activeTab === "schedule" && (
                     <div className="flex items-center justify-center h-[400px] text-slate-400 font-medium">
                     <div className="flex flex-col items-center gap-4">
                        <Calendar className="w-12 h-12 text-slate-300" />
                        Smart Scheduling Module
                     </div>
                   </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
