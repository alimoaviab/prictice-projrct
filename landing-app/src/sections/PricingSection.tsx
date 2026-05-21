import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Building2 } from "@/components/icons";

import { whatsappUrl, WhatsappMessages } from "@/lib/whatsapp";
import { SIGNUP_URL } from "@/lib/config";

export const PricingSection = () => {
  const [isYearly, setIsYearly] = useState(false);

  const defaultPlans = [
    {
      name: "Starter School",
      students: "Up to 200 Students",
      priceMonthly: "4,000",
      priceYearly: "38,400",
      description: "Perfect for small growing schools needing core school management tools.",
      features: ["Student & Staff Directory", "Basic Attendance Tracking", "Fee Collection", "Parent Portal App", "Standard Support"],
      isPopular: false,
      isCustom: false,
    },
    {
      name: "Growth School",
      students: "Up to 500 Students",
      priceMonthly: "9,000",
      priceYearly: "86,400",
      description: "Advanced school ERP features for established schools scaling their operations.",
      features: ["Everything in Starter", "Advanced AI Analytics", "Automated Report Cards", "Payroll Management", "Priority 24/7 Support"],
      isPopular: true,
      isCustom: false,
    },
    {
      name: "Enterprise",
      students: "800+ Students",
      priceMonthly: "Custom",
      priceYearly: "Custom",
      description: "Complete school ERP ecosystem tailored for large multi-campus institutions.",
      features: ["Everything in Growth", "Multi-Campus Management", "Custom Module Development", "Dedicated Account Manager", "On-Premise Deployment Option"],
      isPopular: false,
      isCustom: true,
    }
  ];

  const [plans, setPlans] = useState(defaultPlans);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/subscription/plans');
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !Array.isArray(data)) return;

        const mapped = data.map((p: any) => {
          const priceNum = Number(p.price || 0);
          const isCustom = !!p.is_custom || p.is_custom === true || p.price === 0;
          return {
            name: p.display_name || p.name || p.id || "Plan",
            students: p.student_limit ? `Up to ${p.student_limit} Students` : "—",
            priceMonthly: isCustom ? "Custom" : priceNum.toLocaleString(),
            priceYearly: isCustom ? "Custom" : Math.round(priceNum * 12 * 0.8).toLocaleString(),
            description: p.description || "",
            features: p.features || [],
            isPopular: !!p.popular,
            isCustom,
          };
        });
        if (mapped.length > 0) setPlans(mapped);
      } catch (err) {
        // ignore — keep defaults
      }
    })();
    return () => { cancelled = true };
  }, []);

  return (
    <section id="pricing" className="py-24 bg-slate-50" aria-labelledby="pricing-heading">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            id="pricing-heading"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight"
          >
            Transparent School ERP <span className="text-blue-600">Pricing</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-600 font-medium mb-10"
          >
            No hidden fees, no per-user licensing. Choose the EduPlexo plan that fits your campus size.
          </motion.p>

          {/* Toggle */}
          <motion.div
             initial={{ opacity: 0, y: 10 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="inline-flex items-center p-1.5 bg-slate-200 rounded-full mb-10"
          >
             <button
               onClick={() => setIsYearly(false)}
               className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${!isYearly ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               Monthly
             </button>
             <button
               onClick={() => setIsYearly(true)}
               className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${isYearly ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               Yearly <span className="ml-1 text-emerald-500">-20%</span>
             </button>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 xl:gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative bg-white rounded-[2rem] p-6 md:p-8 transition-all duration-300 flex flex-col hover:-translate-y-2 ${
                plan.isPopular
                  ? "border-2 border-blue-500 shadow-2xl shadow-blue-500/10 scale-[1.02] z-10"
                  : "border border-slate-200/60 shadow-lg hover:shadow-xl"
              }`}
            >
              {plan.isPopular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 bg-blue-500 text-white text-sm font-bold rounded-full normal-case  shadow-md">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xl xl:text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <div className="text-sm font-semibold text-blue-600 bg-blue-50 inline-block px-3 py-1 rounded-full mb-6">
                  {plan.students}
                </div>
                <div className="flex items-end gap-1 mb-4">
                  {plan.priceMonthly !== "Custom" && <span className="text-2xl font-semibold text-slate-400">Rs.</span>}
                  <span className="text-4xl xl:text-5xl font-extrabold text-slate-900 tracking-tight">
                    {isYearly ? plan.priceYearly : plan.priceMonthly}
                  </span>
                  {plan.priceMonthly !== "Custom" && <span className="text-slate-500 font-medium mb-1">/{isYearly ? 'yr' : 'mo'}</span>}
                </div>
                <p className="text-slate-500 leading-relaxed font-medium">{plan.description}</p>
              </div>

              <div className="space-y-4 mb-10 flex-1">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.isPopular ? 'text-blue-500' : 'text-slate-400'}`} />
                    <span className="text-slate-700 font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              <a
                href={
                  plan.priceMonthly === "Custom"
                    ? whatsappUrl(WhatsappMessages.contactSales(plan.name))
                    : SIGNUP_URL
                }
                target={plan.priceMonthly === "Custom" ? "_blank" : undefined}
                rel={plan.priceMonthly === "Custom" ? "noopener noreferrer" : undefined}
                className={`w-full py-4 rounded-xl font-bold transition-all duration-300 flex justify-center items-center gap-2 ${
                  plan.isPopular
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700"
                    : "bg-slate-50 text-slate-900 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                {plan.priceMonthly === "Custom" ? (
                  <><Building2 className="w-5 h-5" /> Contact Sales</>
                ) : (
                  "Start Free Trial"
                )}
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
