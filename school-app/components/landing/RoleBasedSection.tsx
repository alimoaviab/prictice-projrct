"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, BookOpen, Users, User, Calculator } from "lucide-react";

export const RoleBasedSection = () => {
  const [activeRole, setActiveRole] = useState("admin");

  const roles = [
    { id: "admin", label: "Admin", icon: Shield, color: "text-red-500", bg: "bg-red-50", border: "border-red-200" },
    { id: "teacher", label: "Teacher", icon: BookOpen, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-200" },
    { id: "parent", label: "Parent", icon: Users, color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200" },
    { id: "student", label: "Student", icon: User, color: "text-purple-500", bg: "bg-purple-50", border: "border-purple-200" },
    { id: "accountant", label: "Accountant", icon: Calculator, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-200" },
  ];

  const content = {
    admin: {
      title: "Complete Institutional Control",
      desc: "Manage multiple branches, configure system settings, and oversee all operations from a bird's-eye view.",
      features: ["Multi-branch management", "Advanced permissions", "Global reporting", "System configuration"],
    },
    teacher: {
      title: "Focus on Teaching, Not Admin",
      desc: "Streamline attendance, grading, and communication so you can spend more time doing what you do best.",
      features: ["One-click attendance", "Digital gradebooks", "Direct parent messaging", "Lesson planning"],
    },
    parent: {
      title: "Stay Connected to Your Child's Journey",
      desc: "Real-time updates on attendance, academic performance, and direct communication with teachers.",
      features: ["Instant notifications", "Fee payment tracking", "Progress reports", "Event calendars"],
    },
    student: {
      title: "Your Academic Life in One Place",
      desc: "Access assignments, check grades, and view your schedule anytime, anywhere.",
      features: ["Digital assignments", "Timetable access", "Live exam portal", "Library catalog"],
    },
    accountant: {
      title: "Streamlined Financial Operations",
      desc: "Automate fee collection, manage payroll, and generate comprehensive financial reports.",
      features: ["Automated fee reminders", "Payroll processing", "Expense tracking", "Financial analytics"],
    },
  };

  return (
    <section className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
            Tailored experiences for <span className="text-blue-600">every role</span>
          </h2>
          <p className="text-xl text-slate-600">
            A unified platform that adapts to the specific needs of administrators, teachers, parents, and students.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Roles Selector */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setActiveRole(role.id)}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-left ${
                  activeRole === role.id
                    ? `bg-white shadow-xl ${role.border} border scale-105`
                    : "bg-slate-50 border border-transparent hover:bg-slate-100 opacity-60 hover:opacity-100"
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${role.bg} ${role.color}`}>
                  <role.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className={`font-semibold text-lg ${activeRole === role.id ? "text-slate-900" : "text-slate-600"}`}>
                    {role.label} Dashboard
                  </h3>
                </div>
              </button>
            ))}
          </div>

          {/* Role Content Display */}
          <div className="lg:col-span-8">
            <div className="relative bg-slate-50 rounded-[2.5rem] p-8 md:p-12 border border-slate-200 overflow-hidden min-h-[500px] flex flex-col justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeRole}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <div className="max-w-xl">
                    <h3 className="text-3xl font-bold text-slate-900 mb-4">
                      {content[activeRole as keyof typeof content].title}
                    </h3>
                    <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                      {content[activeRole as keyof typeof content].desc}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {content[activeRole as keyof typeof content].features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="font-medium text-slate-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Abstract UI representation */}
                  <div className="absolute right-[-10%] bottom-[-10%] w-3/4 aspect-square bg-gradient-to-tr from-slate-200/40 to-slate-100/40 rounded-full blur-3xl -z-10" />
                  <div className="mt-12 w-full h-48 bg-white rounded-t-2xl border border-slate-200 shadow-xl border-b-0 p-6 relative overflow-hidden">
                     <div className="h-6 w-1/3 bg-slate-100 rounded mb-6" />
                     <div className="space-y-3">
                        <div className="h-4 w-full bg-slate-50 rounded" />
                        <div className="h-4 w-5/6 bg-slate-50 rounded" />
                        <div className="h-4 w-4/6 bg-slate-50 rounded" />
                     </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
