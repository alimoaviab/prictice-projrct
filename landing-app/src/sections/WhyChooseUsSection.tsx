import React from "react";
import { motion } from "framer-motion";
import { Zap, ShieldCheck, Smartphone, CheckCircle2 } from "lucide-react";

export const WhyChooseUsSection = () => {
  const points = [
    {
      icon: Zap,
      title: "Lightning Fast Performance",
      description: "Built on modern web technologies, our platform guarantees sub-second load times. No more waiting for reports to generate or pages to load.",
      color: "text-amber-500",
      bg: "bg-amber-50"
    },
    {
      icon: ShieldCheck,
      title: "Enterprise-Grade Security",
      description: "Role-based access control, strict data isolation, and end-to-end encryption ensure your school's data is always protected.",
      color: "text-emerald-500",
      bg: "bg-emerald-50"
    },
    {
      icon: Smartphone,
      title: "Mobile-First Experience",
      description: "A fully responsive design means teachers can grade on tablets, and parents can check updates on their phones seamlessly.",
      color: "text-blue-500",
      bg: "bg-blue-50"
    }
  ];

  return (
    <section id="security" className="py-24 bg-white relative overflow-hidden">
      {/* Decorative background element - simplified for performance */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-50 to-transparent opacity-60 -translate-y-1/2 translate-x-1/3 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row gap-16 items-center">

          <div className="w-full lg:w-1/2">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight"
            >
              Why modern schools choose <span className="text-blue-600">Eduplexo</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: 0.1 }}
              className="text-lg text-slate-600 mb-10 font-medium"
            >
              We believe school software shouldn't look like it was built in 2005. We've combined consumer-grade UX with enterprise-grade power.
            </motion.p>

            <div className="space-y-8">
              {points.map((point, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: 0.2 + (index * 0.1) }}
                  className="flex gap-5"
                >
                  <div className={`flex-shrink-0 w-12 h-12 rounded-2xl ${point.bg} flex items-center justify-center`}>
                    <point.icon className={`w-6 h-6 ${point.color}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{point.title}</h3>
                    <p className="text-slate-600 leading-relaxed font-medium">{point.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="w-full lg:w-1/2">
             <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5 }}
                className="relative"
             >
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-3xl transform rotate-3 scale-105 opacity-10" />
                <div className="bg-slate-900 rounded-3xl p-8 md:p-12 relative shadow-2xl overflow-hidden">
                   <h3 className="text-3xl font-extrabold text-white mb-8">The Eduplexo Difference</h3>

                   <ul className="space-y-6">
                     {[
                       "Zero implementation fees",
                       "Free data migration from legacy systems",
                       "Unlimited data storage",
                       "24/7 priority customer support",
                       "Monthly feature updates"
                     ].map((item, i) => (
                       <li key={i} className="flex items-center gap-3 text-slate-300 font-medium">
                         <CheckCircle2 className="w-6 h-6 text-blue-400 flex-shrink-0" />
                         <span className="text-lg">{item}</span>
                       </li>
                     ))}
                   </ul>

                   <div className="mt-12 pt-8 border-t border-white/10 flex items-center justify-between">
                     <div>
                       <div className="text-white text-4xl font-extrabold">100%</div>
                       <div className="text-slate-400 text-sm font-semibold normal-case  mt-1">Satisfaction Rate</div>
                     </div>
                     <div className="h-12 w-px bg-white/10" />
                     <div>
                       <div className="text-white text-4xl font-extrabold">&lt; 1hr</div>
                       <div className="text-slate-400 text-sm font-semibold normal-case  mt-1">Support Response</div>
                     </div>
                   </div>
                </div>
             </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
};
