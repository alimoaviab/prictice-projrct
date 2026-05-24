import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppIcon } from "shared/ui/AppIcon";

export const DashboardShowcase = () => {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { id: "analytics", label: "Analytics Dashboard", icon: "LineChart", image: "/analytics-preview.png" },
    { id: "admin", label: "Admin Dashboard", icon: "Layout", image: "/admin-preview.png" },
    { id: "students", label: "Student Records", icon: "Users", image: "/students-preview.png" },
    { id: "security", label: "Access Control", icon: "Shield", image: "/security-preview.png" },
    { id: "ai", label: "Plexa AI Agent", icon: "MessageSquare", image: "/ai-preview.png" },
  ];

  return (
    <section id="dashboard" className="py-24 bg-white overflow-hidden" aria-labelledby="dashboard-heading">
      {/* Anchor alias for footer/navbar links that use "#platform". */}
      <span id="platform" aria-hidden="true" className="block -translate-y-20" />
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-16">

          {/* Content Left */}
          <div className="w-full lg:w-1/3">
            <motion.h2
              id="dashboard-heading"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              className="text-4xl font-bold text-slate-900 mb-6 tracking-tight"
            >
              School ERP Dashboard Designed for <br />
              <span className="text-blue-600">Maximum Clarity</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: 0.1 }}
              className="text-lg text-slate-600 mb-10"
            >
              EduPlexo strips away the noise to give you an interface that is as powerful as it is beautiful. Data you need, right when you need it.
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
                      <AppIcon name={tab.icon} className="w-5 h-5" />
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
               <div className="border-b border-slate-200 bg-slate-100 flex flex-col z-20 shrink-0">
                 {/* Top Tab Bar Row */}
                 <div className="h-10 flex items-center px-4 gap-4">
                   {/* macOS window control buttons */}
                   <div className="flex gap-1.5 shrink-0">
                     <div className="w-3 h-3 rounded-full bg-red-400 border border-red-500/20" />
                     <div className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-500/20" />
                     <div className="w-3 h-3 rounded-full bg-green-400 border border-green-500/20" />
                   </div>
                   
                   {/* Chrome-style Tab */}
                   <div className="flex items-center gap-1.5">
                     <div className="flex items-center bg-white border-t border-x border-slate-200/80 rounded-t-lg px-4 h-8 text-[11px] font-bold text-slate-800 shadow-sm whitespace-nowrap">
                       <span>EduPlexo — {tabs[activeTab].label}</span>
                       <button className="ml-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full p-0.5 transition-colors">
                         <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                       </button>
                     </div>
                     {/* New tab plus button */}
                     <button className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200/60 rounded transition-colors shrink-0">
                       <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                     </button>
                   </div>
                 </div>

                 {/* URL Bar Row */}
                 <div className="h-9 bg-white border-t border-slate-200/80 flex items-center px-4 gap-3">
                   {/* Nav buttons */}
                   <div className="flex items-center gap-2 text-slate-400 shrink-0">
                     <svg className="w-4 h-4 cursor-not-allowed" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                     <svg className="w-4 h-4 cursor-not-allowed" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                     <svg className="w-3.5 h-3.5 hover:text-slate-600 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                   </div>
                   
                   {/* Address Input */}
                   <div className="flex-1 bg-slate-100 border border-slate-200/60 rounded-md h-6 px-3 flex items-center gap-1.5 text-[11px] text-slate-600 select-none">
                     <svg className="w-3 h-3 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                     <span className="font-semibold text-emerald-700">https://</span>
                     <span className="font-medium text-slate-700">eduplexo.com/admin/{tabs[activeTab].id === "admin" ? "dashboard" : tabs[activeTab].id === "ai" ? "ai-assistant" : tabs[activeTab].id}</span>
                   </div>
                 </div>
               </div>

               {/* Screen Content Area */}
               <div 
                 className="flex-1 bg-slate-100 overflow-hidden relative"
               >
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
                       alt={`EduPlexo ${tabs[activeTab].label} — School Management System Dashboard Preview`}
                       className={`w-full h-full border-none ${
                         tabs[activeTab].id === "ai" ? "object-contain p-4 bg-slate-50" : "object-cover object-top"
                       }`}
                       loading="lazy"
                       width="800"
                       height="600"
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
