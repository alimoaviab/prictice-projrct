"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const CtaSection = () => {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="bg-slate-950 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl border border-slate-800"
        >
          {/* Refined Dark Cinematic Background Effects */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-950 to-slate-950" />

          <div className="absolute top-10 left-10 text-white/5 hidden md:block">
             <ShieldCheck className="w-32 h-32" />
          </div>
          <div className="absolute bottom-10 right-10 text-white/5 hidden md:block">
             <ShieldCheck className="w-48 h-48" />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight leading-tight">
              Ready to transform your school's future?
            </h2>
            <p className="text-xl text-slate-400 mb-12 leading-relaxed font-medium">
              Join hundreds of innovative schools that trust EduManage to power their daily operations, engage parents, and empower teachers.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
              <Link
                href="/auth/login"
                className="w-full sm:w-auto px-10 py-5 bg-blue-600 text-white rounded-full font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-500 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 text-lg"
              >
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="#demo"
                className="w-full sm:w-auto px-10 py-5 bg-white/5 text-white border border-white/20 rounded-full font-bold hover:bg-white/10 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center text-lg"
              >
                Book a Demo
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm font-medium text-slate-400">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" /> No credit card required
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" /> 14-day free trial
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Free data migration
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
