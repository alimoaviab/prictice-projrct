"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

export const FaqSection = () => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "How long does it take to set up EduManage?",
      answer: "We typically onboard new schools within 48 hours. Our team handles the entire data migration process from your legacy systems, completely free of charge, ensuring zero downtime for your operations."
    },
    {
      question: "Is our school's data secure?",
      answer: "Absolutely. We employ bank-grade AES-256 encryption, strict role-based access controls, and daily automated backups. Your data is isolated and stored securely in compliance with global education data privacy standards."
    },
    {
      question: "Can it handle multiple campuses?",
      answer: "Yes, our Enterprise plan is specifically designed for multi-branch institutions. You can manage multiple campuses from a single global dashboard while maintaining localized control for individual campus administrators."
    },
    {
      question: "Do parents need to pay for the mobile app?",
      answer: "No, the parent and student mobile applications are completely free to download and use. They are included as part of your school's subscription package."
    },
    {
      question: "What kind of training and support do you provide?",
      answer: "We provide comprehensive virtual training sessions for all your staff during onboarding. Post-launch, you get access to our 24/7 priority support team with guaranteed response times under 1 hour."
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight"
          >
            Frequently asked questions
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-600 font-medium"
          >
            Everything you need to know about migrating to EduManage.
          </motion.p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isExpanded = expandedIndex === index;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-50 rounded-2xl border border-slate-200/60 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className="text-lg font-bold text-slate-900">{faq.question}</span>
                  <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-colors duration-300 ${isExpanded ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
                     <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-6 pt-2 text-slate-600 leading-relaxed font-medium">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
