"use client";

import React from "react";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";

export const FounderSection = () => {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="bg-slate-900 rounded-[3rem] p-8 md:p-16 relative overflow-hidden flex flex-col md:flex-row items-center gap-12">

           {/* Abstract shapes */}
           <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[150%] bg-blue-500/20 rotate-12 blur-3xl rounded-full" />
           <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[100%] bg-purple-500/20 -rotate-12 blur-3xl rounded-full" />

           {/* Image */}
           <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             className="w-48 h-48 md:w-64 md:h-64 rounded-full border-4 border-white/10 overflow-hidden relative z-10 flex-shrink-0 bg-slate-800"
           >
              <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400&h=400" alt="Founder" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />
           </motion.div>

           {/* Content */}
           <div className="relative z-10 flex-1 text-center md:text-left">
              <Quote className="w-12 h-12 text-blue-500/50 mb-6 mx-auto md:mx-0" />
              <motion.h3
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: 0.1 }}
                 className="text-2xl md:text-3xl font-medium text-white leading-relaxed mb-8"
              >
                 "We built EduManage because we saw educators spending 40% of their time on administrative tasks instead of teaching. Our mission is to give that time back to the people shaping our future."
              </motion.h3>

              <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: 0.2 }}
              >
                 <div className="text-xl font-bold text-white">David Chen</div>
                 <div className="text-blue-400">Founder & CEO, EduManage</div>
              </motion.div>
           </div>
        </div>
      </div>
    </section>
  );
};
