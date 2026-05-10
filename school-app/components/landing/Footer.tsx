"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";

export const Footer = () => {
  const links = {
    product: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Integrations", href: "#integrations" },
      { label: "Changelog", href: "#changelog" },
      { label: "Security", href: "#security" },
    ],
    solutions: [
      { label: "K-12 Schools", href: "#" },
      { label: "Higher Education", href: "#" },
      { label: "Multi-Campus", href: "#" },
      { label: "For Teachers", href: "#" },
      { label: "For Parents", href: "#" },
    ],
    company: [
      { label: "About Us", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Contact", href: "#" },
      { label: "Partners", href: "#" },
    ],
    legal: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Cookie Policy", href: "#" },
      { label: "Compliance", href: "#" },
    ]
  };

  return (
    <footer className="bg-white pt-24 pb-12 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 lg:gap-8 mb-20">

          {/* Brand Col */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md">
                <BookOpen className="text-white w-4 h-4" />
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">
                EduManage
              </span>
            </Link>
            <p className="text-slate-500 mb-8 max-w-sm leading-relaxed">
              The next-generation operating system for modern educational institutions. Automate administration, engage parents, and empower teachers.
            </p>
            <div className="flex items-center gap-4">
               {/* Removed unsupported lucide social icons for now */}
               <a href="#" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-200 transition-colors font-bold text-sm">
                  X
               </a>
               <a href="#" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition-colors font-bold text-sm">
                  IN
               </a>
            </div>
          </div>

          {/* Links Cols */}
          <div className="lg:col-span-1">
            <h4 className="font-bold text-slate-900 mb-6">Product</h4>
            <ul className="space-y-4">
              {links.product.map(link => (
                 <li key={link.label}>
                    <Link href={link.href} className="text-slate-500 hover:text-blue-600 transition-colors text-sm font-medium">
                       {link.label}
                    </Link>
                 </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-1">
            <h4 className="font-bold text-slate-900 mb-6">Solutions</h4>
            <ul className="space-y-4">
              {links.solutions.map(link => (
                 <li key={link.label}>
                    <Link href={link.href} className="text-slate-500 hover:text-blue-600 transition-colors text-sm font-medium">
                       {link.label}
                    </Link>
                 </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-1">
            <h4 className="font-bold text-slate-900 mb-6">Company</h4>
            <ul className="space-y-4">
              {links.company.map(link => (
                 <li key={link.label}>
                    <Link href={link.href} className="text-slate-500 hover:text-blue-600 transition-colors text-sm font-medium">
                       {link.label}
                    </Link>
                 </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-1">
            <h4 className="font-bold text-slate-900 mb-6">Subscribe</h4>
            <p className="text-sm text-slate-500 mb-4">Get the latest news and educational insights.</p>
            <div className="flex group">
               <input
                 type="email"
                 placeholder="Enter your email"
                 className="w-full bg-slate-50 border border-slate-200 rounded-l-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
               />
               <button className="bg-blue-600 text-white px-3 rounded-r-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
                  <ArrowRight className="w-4 h-4" />
               </button>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
           <div className="text-sm text-slate-400">
              © {new Date().getFullYear()} EduManage Inc. All rights reserved.
           </div>
           <div className="flex gap-6">
              {links.legal.map(link => (
                 <Link key={link.label} href={link.href} className="text-sm text-slate-400 hover:text-slate-900 transition-colors">
                    {link.label}
                 </Link>
              ))}
           </div>
        </div>
      </div>
    </footer>
  );
};
