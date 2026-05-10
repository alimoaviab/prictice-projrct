"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Layout, Users, Shield, Bell, Search } from "lucide-react";

export const DashboardShowcase = () => {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { id: "analytics", label: "Analytics UI", icon: LineChart },
    { id: "admin", label: "Admin Dashboard", icon: Layout },
    { id: "students", label: "Student Records", icon: Users },
    { id: "security", label: "Access Control", icon: Shield },
  ];

  return (
    <section id="dashboard" className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-16">

          {/* Content Left */}
          <div className="w-full lg:w-1/3">
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              className="text-4xl font-bold text-slate-900 mb-6 tracking-tight"
            >
              Designed for <br />
              <span className="text-blue-600">maximum clarity.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: 0.1 }}
              className="text-lg text-slate-600 mb-10"
            >
              We stripped away the noise to give you an interface that is as powerful as it is beautiful. Data you need, right when you need it.
            </motion.p>

            <div className="space-y-4">
              {tabs.map((tab, idx) => {
                const isActive = activeTab === idx;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(idx)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-300 text-left ${
                      isActive
                        ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                        : "bg-transparent text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isActive ? "bg-white/20" : "bg-slate-100"}`}>
                      <tab.icon className="w-5 h-5" />
                    </div>
                    <span className="font-semibold">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Right Screen */}
          <div className="w-full lg:w-2/3 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-indigo-50 rounded-[2.5rem] transform translate-x-4 translate-y-4 -z-10" />

            <div className="bg-slate-50 border border-slate-200/60 rounded-[2rem] shadow-2xl overflow-hidden aspect-[4/3] md:aspect-[16/10] relative flex flex-col">
               {/* Browser Header Fake */}
               <div className="h-12 border-b border-slate-200 bg-white/50 flex items-center px-4 gap-2 z-20">
                 <div className="flex gap-1.5">
                   <div className="w-3 h-3 rounded-full bg-slate-300" />
                   <div className="w-3 h-3 rounded-full bg-slate-300" />
                   <div className="w-3 h-3 rounded-full bg-slate-300" />
                 </div>
               </div>

               {/* Screen Content Area */}
               <div className="flex-1 relative p-6 bg-slate-50 overflow-hidden">
                 <AnimatePresence mode="wait">
                   <motion.div
                     key={activeTab}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -10 }}
                     transition={{ duration: 0.2 }}
                     className="absolute inset-0 p-6 flex flex-col gap-4 bg-slate-50"
                   >
                      {activeTab === 0 && (
                        <>
                          <div className="h-8 w-48 bg-slate-200 rounded-md mb-2" />
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            {[1,2,3].map(i => <div key={i} className="bg-white rounded-xl h-24 shadow-sm border border-slate-100" />)}
                          </div>
                          <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 relative overflow-hidden p-6 flex flex-col">
                             <div className="h-6 w-32 bg-slate-100 rounded mb-6" />
                             <div className="flex-1 relative">
                                <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                                   <motion.path
                                     d="M0,40 Q10,30 20,45 T40,25 T60,35 T80,10 T100,20"
                                     fill="none"
                                     stroke="#3b82f6"
                                     strokeWidth="2"
                                     initial={{ pathLength: 0 }}
                                     animate={{ pathLength: 1 }}
                                     transition={{ duration: 1.5, ease: "easeInOut" }}
                                   />
                                   <motion.path
                                     d="M0,40 Q10,30 20,45 T40,25 T60,35 T80,10 T100,20 L100,50 L0,50 Z"
                                     fill="url(#gradient)"
                                     initial={{ opacity: 0 }}
                                     animate={{ opacity: 1 }}
                                     transition={{ duration: 1.5, delay: 0.5 }}
                                   />
                                   <defs>
                                      <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                                         <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                                         <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                      </linearGradient>
                                   </defs>
                                </svg>
                             </div>
                          </div>
                        </>
                      )}
                      {activeTab === 1 && (
                         <div className="flex h-full gap-4">
                            {/* Admin Sidebar */}
                            <div className="w-48 bg-white rounded-xl shadow-sm border border-slate-100 h-full flex flex-col gap-2 p-3">
                               <div className="h-6 w-3/4 bg-slate-200 rounded mb-6" />
                               {[1,2,3,4,5].map(i => (
                                 <div key={i} className="flex items-center gap-2 px-2 py-2 rounded bg-slate-50">
                                   <div className="w-4 h-4 rounded bg-slate-200" />
                                   <div className="h-3 w-2/3 bg-slate-200 rounded" />
                                 </div>
                               ))}
                            </div>
                            <div className="flex-1 flex flex-col gap-4">
                               {/* Top Navbar */}
                               <div className="h-14 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-between px-4">
                                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-100 w-1/2">
                                     <Search className="w-4 h-4 text-slate-400" />
                                     <div className="h-3 w-1/3 bg-slate-200 rounded" />
                                  </div>
                                  <div className="flex items-center gap-3">
                                     <div className="relative">
                                       <Bell className="w-5 h-5 text-slate-400" />
                                       <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500" />
                                     </div>
                                     <div className="w-8 h-8 rounded-full bg-blue-100" />
                                  </div>
                               </div>
                               <div className="grid grid-cols-2 gap-4">
                                  {[1,2].map(i => <div key={i} className="h-24 bg-white rounded-xl shadow-sm border border-slate-100" />)}
                               </div>
                               <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100" />
                            </div>
                         </div>
                      )}
                      {activeTab === 2 && (
                        <div className="flex flex-col h-full gap-4">
                           <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                             <div className="h-6 w-48 bg-slate-200 rounded" />
                             <div className="h-8 w-24 bg-blue-600 rounded-md" />
                           </div>
                           <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col gap-3">
                              <div className="grid grid-cols-4 gap-4 pb-2 border-b border-slate-100">
                                 <div className="h-4 bg-slate-100 rounded w-full" />
                                 <div className="h-4 bg-slate-100 rounded w-full" />
                                 <div className="h-4 bg-slate-100 rounded w-full" />
                                 <div className="h-4 bg-slate-100 rounded w-full" />
                              </div>
                              {[1,2,3,4,5].map(i => (
                                 <div key={i} className="grid grid-cols-4 gap-4 items-center py-2">
                                   <div className="flex items-center gap-2">
                                     <div className="w-6 h-6 rounded-full bg-slate-200" />
                                     <div className="h-4 bg-slate-100 rounded w-2/3" />
                                   </div>
                                   <div className="h-4 bg-slate-50 rounded w-full" />
                                   <div className="h-4 bg-slate-50 rounded w-3/4" />
                                   <div className="h-6 bg-green-50 rounded-full w-16" />
                                 </div>
                              ))}
                           </div>
                        </div>
                      )}
                      {activeTab === 3 && (
                        <div className="flex h-full items-center justify-center">
                           <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 max-w-sm w-full text-center">
                             <Shield className="w-16 h-16 text-blue-500 mx-auto mb-6" />
                             <div className="h-6 w-3/4 bg-slate-200 rounded mx-auto mb-4" />
                             <div className="h-4 w-full bg-slate-100 rounded mx-auto mb-2" />
                             <div className="h-4 w-5/6 bg-slate-100 rounded mx-auto mb-8" />
                             <div className="h-10 w-full bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer" />
                           </div>
                        </div>
                      )}
                   </motion.div>
                 </AnimatePresence>
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
