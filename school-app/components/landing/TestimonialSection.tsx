"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Star, Quote } from "lucide-react";

export const TestimonialSection = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);

  const testimonials = [
    {
      name: "Dr. Robert Smith",
      role: "Principal, Oakwood Academy",
      content: "EduManage didn't just digitize our school; it transformed how we operate. The AI analytics alone have saved us hundreds of hours and identified critical trends we were missing.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150"
    },
    {
      name: "Sarah Jenkins",
      role: "Parent & PTA President",
      content: "As a parent, the native app is a game-changer. I get instant notifications if my child is late, can pay fees with Apple Pay, and direct message teachers without relying on paper notes.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150"
    },
    {
      name: "Marcus Johnson",
      role: "Head of IT, Springfield District",
      content: "We migrated 15 campuses to EduManage over a single weekend. The multi-branch control and role-based permissions are robust enough for enterprise, yet simple enough for our staff to adopt immediately.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150"
    }
  ];

  return (
    <section ref={containerRef} className="py-32 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight"
          >
            Loved by <span className="text-blue-600">educators</span> everywhere
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-slate-600"
          >
            Don't just take our word for it. Hear from the people who use EduManage every day.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((test, i) => (
            <motion.div
              key={i}
              style={{ y: i % 2 !== 0 ? y : 0 }}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="bg-slate-50 rounded-[2rem] p-8 relative group hover:bg-white hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border border-slate-100"
            >
              <Quote className="absolute top-6 right-6 w-10 h-10 text-slate-200 group-hover:text-blue-100 transition-colors" />

              <div className="flex gap-1 mb-6">
                 {[...Array(test.rating)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 fill-amber-400 text-amber-400" />
                 ))}
              </div>

              <p className="text-slate-700 text-lg leading-relaxed mb-8 relative z-10">
                "{test.content}"
              </p>

              <div className="flex items-center gap-4 mt-auto">
                 <img src={test.image} alt={test.name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                 <div>
                    <div className="font-bold text-slate-900">{test.name}</div>
                    <div className="text-sm text-slate-500">{test.role}</div>
                 </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
