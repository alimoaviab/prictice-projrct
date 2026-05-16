/**
 * Careers — placeholder until live job listings ship. Keeps the brand voice
 * and gives visitors a real way to reach the team.
 */

import { Mail, MessageCircle } from 'lucide-react';

import { PageShell } from '@/components/PageShell';

const CULTURE = [
  {
    title: 'Craft over hustle',
    body: 'We ship considered work — not the most code, the right code, beautifully made.',
  },
  {
    title: 'Customers first',
    body: 'Every roadmap call is anchored to a real school we serve. No theoretical features.',
  },
  {
    title: 'Remote-friendly',
    body: 'We operate across time zones with rituals that respect deep work and family time.',
  },
];

export function CareersPage() {
  return (
    <PageShell
      eyebrow="Careers"
      title="Help build the school platform of the future."
      description="We\u2019re a small, senior team obsessed with shipping the most polished school operating system on the planet. If that sounds like you, we\u2019d love to hear from you."
    >
      <div className="space-y-16">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {CULTURE.map((c) => (
            <div
              key={c.title}
              className="rounded-2xl bg-white border border-slate-200/60 p-7 shadow-sm"
            >
              <h3 className="text-base font-bold text-slate-900 mb-2 tracking-tight">
                {c.title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">{c.body}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl bg-white border border-slate-200/60 p-10 md:p-14 text-center shadow-sm">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            We\u2019re not hiring publicly today &mdash; but we\u2019re always reading.
          </h2>
          <p className="mt-4 text-slate-600 max-w-xl mx-auto leading-relaxed">
            If you\u2019re a designer, engineer, or product thinker who wants to
            shape education for the next generation, send a short note and a
            link to your work.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="mailto:plexotecnologies@gmail.com"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 hover:shadow-lg transition-all"
            >
              <Mail className="w-4 h-4" />
              Email the team
            </a>
            <a
              href="https://wa.me/923064944326"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white border border-slate-200 text-slate-700 font-semibold hover:border-blue-200 hover:text-blue-600 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              Message on WhatsApp
            </a>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
