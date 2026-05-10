"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

export const FaqSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "How long does it take to set up EduManage?",
      a: "Our onboarding team ensures a smooth transition. Basic setup takes just 24-48 hours. Full data migration and staff training typically complete within 1-2 weeks, depending on your school's size.",
    },
    {
      q: "Is our school's data secure?",
      a: "Absolutely. We employ bank-grade AES-256 encryption, regular automated backups, and strict role-based access control. Our servers are hosted on enterprise-tier AWS infrastructure.",
    },
    {
      q: "Can multiple campuses use the same system?",
      a: "Yes, our Enterprise plan includes robust multi-branch management. You can control permissions, generate global reports, and manage all campuses from a single centralized super-admin dashboard.",
    },
    {
      q: "Is the parent mobile app included in all plans?",
      a: "Yes, the dedicated parent mobile app is included in all our plans at no extra cost. We believe strong parent-teacher communication is fundamental to student success.",
    },
    {
      q: "Can schools customize the modules they want to use?",
      a: "Yes. Our platform is modular. You can start with basic features like attendance and fees, and activate advanced modules like library or transport management when you're ready.",
    },
    {
      q: "Do you provide training for our teachers and staff?",
      a: "We provide comprehensive onboarding, interactive video tutorials, and live training sessions for your staff. Enterprise customers also receive a dedicated account manager for ongoing support.",
    },
  ];

  return (
    <section className="py-24 bg-slate-50 relative">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-slate-600">
            Everything you need to know about migrating to EduManage.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-5 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors"
              >
                <span className="text-lg font-semibold text-slate-900 text-left">{faq.q}</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${openIndex === index ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                   {openIndex === index ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <div className="px-6 pb-6 pt-2 text-slate-600 leading-relaxed">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
