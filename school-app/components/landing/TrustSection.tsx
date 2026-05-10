"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Users, Building2, Globe2, Award } from "lucide-react";

const Counter = ({ value, label, icon: Icon }: { value: string, label: string, icon: any }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex flex-col items-center p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
    >
      <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
        <Icon className="w-6 h-6" />
      </div>
      <div className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">{value}</div>
      <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">{label}</div>
    </motion.div>
  );
};

export const TrustSection = () => {
  const logos = [
    "Oxford Academy",
    "Cambridge High",
    "Stanford Prep",
    "MIT International",
    "Harvard Public",
    "Yale Charter",
  ];

  return (
    <section className="py-24 bg-white border-b border-slate-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-4">
            Trusted by Excellence
          </h2>
          <p className="text-3xl md:text-4xl font-semibold text-slate-900 mb-12">
            Powering the world's most innovative educational institutions
          </p>
        </div>

        {/* Infinite Logo Scroll */}
        <div className="relative flex overflow-x-hidden mb-24 group">
          <div className="absolute top-0 bottom-0 left-0 w-32 z-10 bg-gradient-to-r from-white to-transparent" />
          <div className="absolute top-0 bottom-0 right-0 w-32 z-10 bg-gradient-to-l from-white to-transparent" />

          <motion.div
            animate={{ x: [0, -1035] }}
            transition={{
              repeat: Infinity,
              ease: "linear",
              duration: 20,
            }}
            className="flex items-center whitespace-nowrap gap-16 pr-16 group-hover:[animation-play-state:paused]"
          >
            {[...logos, ...logos, ...logos].map((logo, index) => (
              <div
                key={index}
                className="text-2xl font-bold text-slate-300 flex-shrink-0 grayscale hover:grayscale-0 hover:text-blue-900 transition-all duration-300"
              >
                {logo}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Counter icon={Building2} value="500+" label="Schools" />
          <Counter icon={Users} value="1M+" label="Students" />
          <Counter icon={Globe2} value="25+" label="Countries" />
          <Counter icon={Award} value="99.9%" label="Uptime" />
        </div>
      </div>
    </section>
  );
};
