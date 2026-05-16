/**
 * Typography primitives used by the legal pages so all three (Privacy,
 * Terms, Cookies) read with consistent rhythm and spacing.
 */

import type { ReactNode } from 'react';

interface LegalSectionProps {
  number?: string | number;
  title: string;
  children: ReactNode;
}

export function LegalSection({ number, title, children }: LegalSectionProps) {
  return (
    <section className="border-t border-slate-200/60 py-10 first:border-t-0 first:pt-0">
      <div className="flex items-baseline gap-3 mb-4">
        {number != null ? (
          <span className="text-xs font-bold text-blue-600 tracking-widest">
            {String(number).padStart(2, '0')}
          </span>
        ) : null}
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
          {title}
        </h2>
      </div>
      <div className="prose-legal text-slate-600 leading-relaxed text-[15px] space-y-4">
        {children}
      </div>
    </section>
  );
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 list-disc pl-5 marker:text-blue-500">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
