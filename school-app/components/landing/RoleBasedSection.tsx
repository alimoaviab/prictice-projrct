"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, UserCheck, BookOpen, GraduationCap, Calculator } from "lucide-react";

export const RoleBasedExperienceSection = () => {
  const [activeRole, setActiveRole] = useState(0);

  const roles = [
    { id: "admin", label: "Admin", icon: ShieldCheck },
    { id: "teacher", label: "Teacher", icon: BookOpen },
    { id: "parent", label: "Parent", icon: UserCheck },
    { id: "student", label: "Student", icon: GraduationCap },
    { id: "accountant", label: "Accountant", icon: Calculator },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight"
          >
            Built for <span className="text-blue-600">everyone</span>.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-600 font-medium"
          >
            Distinct, perfectly-tailored experiences for every role in your institution.
          </motion.p>
        </div>

        {/* Tabs Row */}
        <div className="flex gap-4 overflow-x-auto pb-4 justify-start md:justify-center mb-8 scrollbar-hide">
          {roles.map((role, idx) => (
            <button
              key={role.id}
              onClick={() => setActiveRole(idx)}
              className={`flex items-center gap-2 px-6 py-3 rounded-full whitespace-nowrap transition-all duration-300 font-semibold ${
                activeRole === idx
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <role.icon className="w-5 h-5" />
              {role.label}
            </button>
          ))}
        </div>

        {/* Tab Content Container */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-8 relative overflow-hidden min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeRole}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full"
            >
              {activeRole === 0 && (
                <div className="flex flex-col md:flex-row gap-8 items-center h-full">
                   <div className="flex-1 space-y-6">
                      <h3 className="text-3xl font-bold text-slate-900">Total Operational Control</h3>
                      <p className="text-slate-600 text-lg leading-relaxed">Oversee multiple campuses, manage staff permissions, and access high-level analytics in real time.</p>
                      <ul className="space-y-3">
                         {["Multi-branch management", "Advanced permission roles", "System-wide analytics"].map((item, i) => (
                           <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                             <div className="w-2 h-2 rounded-full bg-blue-500" /> {item}
                           </li>
                         ))}
                      </ul>
                   </div>
                   <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 w-full">
                      <div className="h-8 w-48 bg-slate-100 rounded mb-6" />
                      <div className="grid grid-cols-2 gap-4">
                        {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-50 rounded-xl" />)}
                      </div>
                   </div>
                </div>
              )}
              {activeRole === 1 && (
                <div className="flex flex-col md:flex-row gap-8 items-center h-full">
                   <div className="flex-1 space-y-6">
                      <h3 className="text-3xl font-bold text-slate-900">Empower Educators</h3>
                      <p className="text-slate-600 text-lg leading-relaxed">Spend less time on paperwork and more time teaching with automated grading and attendance tools.</p>
                      <ul className="space-y-3">
                         {["One-click attendance", "Automated gradebooks", "Classroom behavior tracking"].map((item, i) => (
                           <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                             <div className="w-2 h-2 rounded-full bg-emerald-500" /> {item}
                           </li>
                         ))}
                      </ul>
                   </div>
                   <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 w-full flex flex-col gap-4">
                      <div className="h-10 bg-slate-50 rounded-lg flex items-center px-4 justify-between">
                         <div className="h-4 w-24 bg-slate-200 rounded" />
                         <div className="h-6 w-24 bg-emerald-100 rounded-full" />
                      </div>
                      {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-50 rounded-lg" />)}
                   </div>
                </div>
              )}
              {activeRole === 2 && (
                <div className="flex flex-col md:flex-row gap-8 items-center h-full">
                   <div className="flex-1 space-y-6">
                      <h3 className="text-3xl font-bold text-slate-900">Keep Parents Connected</h3>
                      <p className="text-slate-600 text-lg leading-relaxed">Real-time alerts, instant fee payments, and a direct line of communication to teachers.</p>
                      <ul className="space-y-3">
                         {["Instant push notifications", "Online fee payments", "Live academic tracking"].map((item, i) => (
                           <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                             <div className="w-2 h-2 rounded-full bg-amber-500" /> {item}
                           </li>
                         ))}
                      </ul>
                   </div>
                   <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 w-full max-w-sm mx-auto aspect-[9/16] relative">
                       {/* Mobile mockup */}
                       <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 rounded-t-xl" />
                       <div className="mt-8 space-y-4">
                          <div className="h-20 bg-blue-50 rounded-xl" />
                          <div className="grid grid-cols-2 gap-4">
                             <div className="h-24 bg-slate-50 rounded-xl" />
                             <div className="h-24 bg-slate-50 rounded-xl" />
                          </div>
                          <div className="h-32 bg-slate-50 rounded-xl" />
                       </div>
                   </div>
                </div>
              )}
              {activeRole === 3 && (
                <div className="flex flex-col md:flex-row gap-8 items-center h-full">
                   <div className="flex-1 space-y-6">
                      <h3 className="text-3xl font-bold text-slate-900">Student Independence</h3>
                      <p className="text-slate-600 text-lg leading-relaxed">A dedicated portal for students to track their assignments, join live classes, and view their progress.</p>
                      <ul className="space-y-3">
                         {["Digital assignments", "Live class links", "Personal timetable"].map((item, i) => (
                           <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                             <div className="w-2 h-2 rounded-full bg-purple-500" /> {item}
                           </li>
                         ))}
                      </ul>
                   </div>
                   <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 w-full flex gap-4">
                      <div className="w-1/3 bg-slate-50 rounded-xl" />
                      <div className="w-2/3 flex flex-col gap-4">
                         <div className="h-1/2 bg-purple-50 rounded-xl" />
                         <div className="h-1/2 bg-slate-50 rounded-xl" />
                      </div>
                   </div>
                </div>
              )}
              {activeRole === 4 && (
                <div className="flex flex-col md:flex-row gap-8 items-center h-full">
                   <div className="flex-1 space-y-6">
                      <h3 className="text-3xl font-bold text-slate-900">Financial Clarity</h3>
                      <p className="text-slate-600 text-lg leading-relaxed">Automate invoicing, track defaulters, manage payroll, and generate comprehensive financial reports.</p>
                      <ul className="space-y-3">
                         {["Automated fee receipts", "Payroll management", "Expense tracking"].map((item, i) => (
                           <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                             <div className="w-2 h-2 rounded-full bg-rose-500" /> {item}
                           </li>
                         ))}
                      </ul>
                   </div>
                   <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 w-full">
                       <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                          <div className="h-6 w-32 bg-slate-100 rounded" />
                          <div className="h-8 w-24 bg-rose-100 rounded-md" />
                       </div>
                       <div className="space-y-4">
                          {[1,2,3,4].map(i => (
                             <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                <div className="h-4 w-32 bg-slate-200 rounded" />
                                <div className="h-4 w-16 bg-slate-300 rounded" />
                             </div>
                          ))}
                       </div>
                   </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
