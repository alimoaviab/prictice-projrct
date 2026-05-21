import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "@/components/icons";

export const FaqSection = () => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "What is EduPlexo school management system?",
      answer: "EduPlexo is an AI-powered school management system and school ERP platform that automates attendance, fee collection, exam management, parent communication, and daily school operations. It is designed for schools in Pakistan and worldwide, offering features like student management, teacher dashboards, analytics, and a mobile parent app."
    },
    {
      question: "How much does EduPlexo school ERP cost in Pakistan?",
      answer: "EduPlexo offers transparent pricing starting from PKR 4,000/month for schools with up to 200 students (Starter plan). The Growth plan for up to 500 students is PKR 9,000/month. Enterprise plans for 800+ students are custom-priced. All plans include a 14-day free trial with no credit card required."
    },
    {
      question: "How long does it take to set up EduPlexo school management software?",
      answer: "We typically onboard new schools within 48 hours. Our team handles the entire data migration process from your legacy systems completely free of charge, ensuring zero downtime for your school operations. This is significantly faster than traditional school ERP implementations that can take 2-4 weeks."
    },
    {
      question: "Is student data secure in EduPlexo?",
      answer: "Absolutely. EduPlexo employs bank-grade AES-256 encryption, strict role-based access controls, and daily automated backups. Your school data is isolated per tenant and stored securely in compliance with global education data privacy standards including GDPR and FERPA guidelines."
    },
    {
      question: "Can EduPlexo handle multiple school campuses?",
      answer: "Yes, our Enterprise plan is specifically designed for multi-branch institutions. You can manage multiple campuses from a single global dashboard while maintaining localized control for individual campus administrators. This makes EduPlexo ideal for school chains and educational networks across Pakistan."
    },
    {
      question: "Do parents need to pay for the EduPlexo mobile app?",
      answer: "No, the parent and student mobile applications are completely free to download and use. They are included as part of your school subscription package. Parents can access attendance records, grades, fee status, homework, and school announcements at no additional cost."
    },
    {
      question: "What kind of training and support does EduPlexo provide?",
      answer: "We provide comprehensive virtual training sessions for all your staff during onboarding. Post-launch, you get access to our priority support team with guaranteed response times under 1 hour. Support is available via WhatsApp, email, and phone. We also provide video tutorials and documentation."
    },
    {
      question: "Does EduPlexo work offline or only online?",
      answer: "EduPlexo is a cloud-based school management system that requires internet connectivity for full functionality. However, the mobile app caches certain data for offline viewing, and attendance can be taken offline and synced when connectivity is restored. Our platform has 99.9% uptime guarantee."
    },
    {
      question: "Can I migrate data from my current school software to EduPlexo?",
      answer: "Yes, we offer free data migration from any existing school management system or manual records (Excel, paper-based). Our team handles the entire migration process, ensuring all student records, fee history, attendance data, and academic records are transferred accurately."
    },
    {
      question: "What makes EduPlexo different from other school ERP systems?",
      answer: "EduPlexo stands out with its AI-powered command agent (Plexa) that allows natural language queries about school data, modern consumer-grade user interface, transparent pricing with no hidden fees, free data migration, and built specifically for the Pakistani education market while serving schools globally."
    },
    {
      question: "Is there a free trial available for EduPlexo?",
      answer: "Yes, all EduPlexo plans come with a 14-day free trial. You can explore all features, import sample data, and test the platform with your team before committing. No credit card is required to start your free trial."
    },
    {
      question: "Does EduPlexo support Urdu language?",
      answer: "EduPlexo supports both English and Urdu interfaces, making it accessible for all staff members, parents, and students in Pakistan. The platform can be switched between languages based on user preference."
    }
  ];

  return (
    <section id="faq" className="py-24 bg-white" aria-labelledby="faq-heading">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <motion.h2
            id="faq-heading"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight"
          >
            Frequently Asked Questions About EduPlexo
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-600 font-medium"
          >
            Everything you need to know about our school management system and school ERP platform.
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
                transition={{ delay: index * 0.05 }}
                className="bg-slate-50 rounded-2xl border border-slate-200/60 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left"
                  aria-expanded={isExpanded}
                >
                  <span className="text-lg font-bold text-slate-900 pr-4">{faq.question}</span>
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
