/**
 * PageShell — the reusable wrapper for non-home routes (About, Careers,
 * Privacy, Terms, Cookies).
 *
 * Keeps brand consistency by reusing the same Navbar + Footer that the
 * home page renders. The hero strip up top echoes the site's premium
 * gradient style without copying the home hero.
 */

import { useEffect, type ReactNode } from 'react';

import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

interface PageShellProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
}

export function PageShell({ eyebrow, title, description, children }: PageShellProps) {
  // Sub-pages always start at the top.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-blue-100 selection:text-blue-900 font-sans flex flex-col">
      <Navbar />

      <header className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-100/60 via-slate-50 to-slate-50"
        />
        <div className="max-w-4xl mx-auto px-6 text-center">
          {eyebrow ? (
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-blue-600 mb-5">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            {title}
          </h1>
          {description ? (
            <p className="mt-6 text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
              {description}
            </p>
          ) : null}
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-6 pb-24">{children}</div>
      </main>

      <Footer />
    </div>
  );
}
