/**
 * About EduPlexo — premium SaaS narrative covering modern infrastructure,
 * AI-powered education management, scale, and reliability.
 */

import { motion } from 'framer-motion';
import {
  Sparkles,
  Building2,
  ShieldCheck,
  Rocket,
  Globe,
  HeartHandshake,
} from 'lucide-react';

import { PageShell } from '@/components/PageShell';

const PILLARS = [
  {
    icon: Building2,
    title: 'Modern School Infrastructure',
    description:
      'A unified operating system for academics, finance, and parent communication — replacing dozens of legacy tools with one elegant platform.',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Education Management',
    description:
      'Embedded AI surfaces insights, predicts at-risk students, and automates the busywork that pulls teachers away from teaching.',
  },
  {
    icon: ShieldCheck,
    title: 'Trusted School Operating System',
    description:
      'Bank-grade encryption, strict tenant isolation, and audited access controls keep every school\u2019s data sovereign and protected.',
  },
  {
    icon: Rocket,
    title: 'Built to Scale',
    description:
      'Engineered to grow with you — from a single campus to a multi-school network, without ever slowing the people who use it daily.',
  },
  {
    icon: Globe,
    title: 'Innovation by Design',
    description:
      'A design system, motion language, and product cadence inspired by the world\u2019s leading SaaS companies.',
  },
  {
    icon: HeartHandshake,
    title: 'Reliability You Can Feel',
    description:
      '99.99% uptime, transparent status, and a partner team that treats every school like a flagship customer.',
  },
];

const STATS = [
  { value: '99.99%', label: 'Uptime SLA' },
  { value: '4', label: 'Connected portals' },
  { value: '256-bit', label: 'AES encryption' },
  { value: '24/7', label: 'Global support' },
];

export function AboutPage() {
  return (
    <PageShell
      eyebrow="About EduPlexo"
      title="Building the operating system for modern education."
      description="EduPlexo is the AI-powered school platform trusted by institutions to run academics, operations, and family communication with the elegance of a global SaaS product."
    >
      <div className="space-y-20">
        {/* Stats strip */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl bg-white border border-slate-200/60 p-5 text-center shadow-sm"
            >
              <div className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                {s.value}
              </div>
              <div className="mt-1 text-xs font-semibold tracking-wide uppercase text-slate-500">
                {s.label}
              </div>
            </div>
          ))}
        </section>

        {/* Pillars */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 tracking-tight">
            What we stand for
          </h2>
          <p className="text-slate-600 max-w-2xl mb-10">
            Six principles guide every screen, API, and decision we ship.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {PILLARS.map((p, idx) => {
              const Icon = p.icon;
              return (
                <motion.article
                  key={p.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.45, delay: idx * 0.05 }}
                  className="rounded-2xl bg-white border border-slate-200/60 p-7 hover:border-blue-200 hover:shadow-md transition-all"
                >
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2 tracking-tight">
                    {p.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {p.description}
                  </p>
                </motion.article>
              );
            })}
          </div>
        </section>

        {/* Closing statement */}
        <section className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-10 md:p-14 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            One platform. Every school. Built for the next decade.
          </h2>
          <p className="mt-5 text-slate-300 max-w-2xl mx-auto leading-relaxed">
            EduPlexo is engineered for the institutions shaping how the next
            generation learns — combining operational depth with the polish of
            modern consumer software. We exist so that educators can focus on
            education, and students can focus on growing.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
