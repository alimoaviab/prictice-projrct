import { useEffect } from 'react';
import { Seo } from '@/components/Seo';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';
import { CheckCircle2, Building2, ArrowRight } from '@/components/icons';
import { whatsappUrl, WhatsappMessages } from '@/lib/whatsapp';
import { SIGNUP_URL } from '@/lib/config';

const plans = [
  {
    name: 'Starter School',
    students: 'Up to 200 Students',
    priceMonthly: '4,000',
    priceYearly: '38,400',
    description: 'Perfect for small growing schools needing core management tools.',
    features: [
      'Student & Staff Directory',
      'Basic Attendance Tracking',
      'Fee Collection',
      'Parent Portal App',
      'Standard Support',
    ],
    isPopular: false,
    isCustom: false,
  },
  {
    name: 'Growth School',
    students: 'Up to 500 Students',
    priceMonthly: '9,000',
    priceYearly: '86,400',
    description: 'Advanced features for established schools scaling their operations.',
    features: [
      'Everything in Starter',
      'Advanced AI Analytics',
      'Automated Report Cards',
      'Payroll Management',
      'Priority 24/7 Support',
    ],
    isPopular: true,
    isCustom: false,
  },
  {
    name: 'Enterprise',
    students: '800+ Students',
    priceMonthly: 'Custom',
    priceYearly: 'Custom',
    description: 'Complete ERP ecosystem tailored for large multi-campus institutions.',
    features: [
      'Everything in Growth',
      'Multi-Campus Management',
      'Custom Module Development',
      'Dedicated Account Manager',
      'On-Premise Deployment Option',
    ],
    isPopular: false,
    isCustom: true,
  },
];

export function PricingPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Seo
        title="EduPlexo Pricing — School Management System Plans & Cost"
        description="EduPlexo school management system pricing: Starter from PKR 4,000/mo, Growth from PKR 9,000/mo, Enterprise custom. 14-day free trial. No hidden fees."
        keywords="school management system pricing, school ERP cost, school software price Pakistan, affordable school ERP, school management system plans"
        canonical="https://www.eduplexo.com/pricing"
        ogTitle="EduPlexo Pricing — Affordable School ERP Plans"
        ogDescription="Transparent pricing for EduPlexo school management system. Plans from PKR 4,000/month. 14-day free trial. No hidden fees."
      />
      <Navbar />

      <header className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-100/60 via-slate-50 to-slate-50" />
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-blue-600 mb-5">
            Transparent Pricing
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            Simple, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Predictable</span> Pricing
          </h1>
          <p className="mt-6 text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
            No hidden fees, no per-user licensing. Choose the plan that fits your campus size. All plans include a 14-day free trial.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative bg-white rounded-[2rem] p-8 transition-all duration-300 flex flex-col hover:-translate-y-2 ${
                plan.isPopular
                  ? 'border-2 border-blue-500 shadow-2xl shadow-blue-500/10 scale-105 z-10'
                  : 'border border-slate-200/60 shadow-lg hover:shadow-xl'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 bg-blue-500 text-white text-sm font-bold rounded-full shadow-md">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h2>
                <div className="text-sm font-semibold text-blue-600 bg-blue-50 inline-block px-3 py-1 rounded-full mb-6">
                  {plan.students}
                </div>
                <div className="flex items-end gap-1 mb-4">
                  {plan.priceMonthly !== 'Custom' && <span className="text-2xl font-semibold text-slate-400">Rs.</span>}
                  <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                    {plan.priceMonthly}
                  </span>
                  {plan.priceMonthly !== 'Custom' && <span className="text-slate-500 font-medium mb-1">/mo</span>}
                </div>
                <p className="text-slate-500 leading-relaxed">{plan.description}</p>
              </div>

              <div className="space-y-4 mb-10 flex-1">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.isPopular ? 'text-blue-500' : 'text-slate-400'}`} />
                    <span className="text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>

              <a
                href={
                  plan.priceMonthly === 'Custom'
                    ? whatsappUrl(WhatsappMessages.contactSales(plan.name))
                    : SIGNUP_URL
                }
                target={plan.priceMonthly === 'Custom' ? '_blank' : undefined}
                rel={plan.priceMonthly === 'Custom' ? 'noopener noreferrer' : undefined}
                className={`w-full py-4 rounded-xl font-bold transition-all duration-300 flex justify-center items-center gap-2 ${
                  plan.isPopular
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700'
                    : 'bg-slate-50 text-slate-900 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {plan.priceMonthly === 'Custom' ? (
                  <><Building2 className="w-5 h-5" /> Contact Sales</>
                ) : (
                  'Start Free Trial'
                )}
              </a>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center bg-white rounded-2xl border border-slate-200/60 p-8 md:p-12 max-w-3xl mx-auto"
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-4">All Plans Include</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            {[
              'Free data migration from legacy systems',
              'Zero implementation fees',
              'Unlimited data storage',
              'Mobile app for parents & students',
              'Regular feature updates',
              'Secure cloud hosting',
              'Email & chat support',
              'Comprehensive training',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-slate-700">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-12 md:p-16"
        >
          <h2 className="text-3xl font-extrabold text-white mb-4">Need a Custom Solution?</h2>
          <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
            Large institutions and multi-campus schools can get a tailored plan with custom features and dedicated support.
          </p>
          <a
            href={whatsappUrl(WhatsappMessages.contactSales('Enterprise'))}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-full font-semibold shadow-lg hover:bg-blue-700 hover:-translate-y-1 transition-all"
          >
            Contact Sales <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
