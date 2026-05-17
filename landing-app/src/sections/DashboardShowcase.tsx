import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Layout, Users, Shield, MessageSquare } from "@/components/icons";

export const DashboardShowcase = () => {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { id: "analytics", label: "Analytics UI", icon: LineChart, image: "/analytics-preview.png" },
    { id: "admin", label: "Admin Dashboard", icon: Layout, image: "/admin-preview.png" },
    { id: "students", label: "Student Records", icon: Users, image: "/students-preview.png" },
    { id: "security", label: "Access Control", icon: Shield, image: "/security-preview.png" },
    { id: "ai", label: "Plexa AI", icon: MessageSquare, image: "/ai-preview.png" },
  ];

  return (
    <section id="dashboard" className="py-24 bg-white overflow-hidden">
      {/* Anchor alias for footer/navbar links that use "#platform". */}
      <span id="platform" aria-hidden="true" className="block -translate-y-20" />
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
               <div className="flex-1 relative bg-slate-100 overflow-hidden">
                 <AnimatePresence mode="wait">
                   <motion.div
                     key={activeTab}
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     transition={{ duration: 0.25 }}
                     className="absolute inset-0 w-full h-full"
                   >
                     <img
                       src={tabs[activeTab].image}
                       alt={tabs[activeTab].label}
                       className={`w-full h-full border-none ${
                         tabs[activeTab].id === "ai" ? "object-contain p-4 bg-slate-50" : "object-cover object-top"
                       }`}
                     />
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
