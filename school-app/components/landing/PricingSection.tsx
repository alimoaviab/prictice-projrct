"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Building2 } from "lucide-react";

export const PricingSection = () => {
  const [isYearly, setIsYearly] = useState(true);

  const plans = [
    {
      name: "Starter School",
      desc: "Perfect for growing schools.",
      students: "Up to 200 Students",
      priceMonthly: 4000,
      priceYearly: 40000,
      features: ["Attendance & Exams", "Basic Reports", "Parent App", "Notifications"],
      notIncluded: ["Library Management", "Hostel & Transport", "Payroll"],
      popular: false,
    },
    {
      name: "Growth School",
      desc: "For established institutions.",
      students: "Up to 500 Students",
      priceMonthly: 8000,
      priceYearly: 80000,
      features: ["Attendance & Exams", "Advanced Analytics", "Parent App", "Library Management", "Hostel & Transport"],
      notIncluded: ["Payroll", "Multi-branch"],
      popular: true,
    },
    {
      name: "Enterprise",
      desc: "Complete control for large networks.",
      students: "800+ Students",
      priceMonthly: "Custom",
      priceYearly: "Custom",
      features: ["All Growth features", "Payroll Management", "Multi-branch Control", "Custom Integrations", "Dedicated Account Manager"],
      notIncluded: [],
      popular: false,
    },
  ];

  return (
    <section className="py-32 bg-white relative" id="pricing">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
            Transparent pricing for <span className="text-blue-600">schools of all sizes</span>
          </h2>
          <p className="text-xl text-slate-600 mb-10">
            Start with what you need, upgrade as your institution grows.
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-semibold ${!isYearly ? 'text-slate-900' : 'text-slate-500'}`}>Monthly</span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className="relative w-16 h-8 rounded-full bg-slate-200 transition-colors duration-300 focus:outline-none"
              style={{ backgroundColor: isYearly ? '#2563eb' : '#e2e8f0' }}
            >
              <motion.div
                className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-sm"
                animate={{ x: isYearly ? 32 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
            <span className={`text-sm font-semibold flex items-center gap-2 ${isYearly ? 'text-slate-900' : 'text-slate-500'}`}>
              Annually <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-bold">Save 16%</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative bg-white rounded-3xl p-8 border ${
                plan.popular ? "border-blue-500 shadow-2xl shadow-blue-500/10 scale-105 z-10" : "border-slate-200 shadow-lg hover:shadow-xl transition-shadow"
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-sm">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <p className="text-slate-500 text-sm mb-4">{plan.desc}</p>
                <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600 bg-indigo-50 w-max px-3 py-1 rounded-lg mb-6">
                   <Building2 className="w-4 h-4" />
                   {plan.students}
                </div>

                <div className="flex items-baseline gap-1">
                  {typeof plan.priceMonthly === "number" ? (
                    <>
                      <span className="text-4xl font-extrabold text-slate-900">
                        ₹{isYearly ? (Number(plan.priceYearly) / 12).toLocaleString() : plan.priceMonthly.toLocaleString()}
                      </span>
                      <span className="text-slate-500 font-medium">/mo</span>
                    </>
                  ) : (
                    <span className="text-4xl font-extrabold text-slate-900">{plan.priceMonthly}</span>
                  )}
                </div>
                {typeof plan.priceMonthly === "number" && isYearly && (
                   <div className="text-sm text-slate-400 mt-1">Billed ₹{Number(plan.priceYearly).toLocaleString()} yearly</div>
                )}
              </div>

              <div className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 font-bold" />
                    </div>
                    <span className="text-slate-700 font-medium">{feature}</span>
                  </div>
                ))}
                {plan.notIncluded.map((feature) => (
                  <div key={feature} className="flex items-start gap-3 opacity-50">
                    <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <X className="w-3 h-3 font-bold" />
                    </div>
                    <span className="text-slate-500">{feature}</span>
                  </div>
                ))}
              </div>

              <button className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                plan.popular
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:shadow-blue-600/50"
                  : "bg-slate-50 text-slate-900 hover:bg-slate-100 border border-slate-200"
              }`}>
                {typeof plan.priceMonthly === "number" ? "Start Free Trial" : "Contact Sales"}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
