"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, BookOpen, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Platform", href: "#platform" },
    { label: "Solutions", href: "#solutions" },
    { label: "Pricing", href: "#pricing" },
    { label: "Resources", href: "#resources" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-white/70 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-b border-slate-200/50 py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group relative z-50">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 overflow-hidden">
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <BookOpen className="text-white w-5 h-5 relative z-10" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 tracking-tight">
            EduManage
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/50 backdrop-blur-md p-1.5 rounded-full border border-slate-200/50">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-4 py-2 rounded-full hover:bg-white hover:shadow-sm"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Auth CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors px-4 py-2"
          >
            Log in
          </Link>
          <Link
            href="#demo"
            className="group relative inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-slate-900 px-6 py-2.5 rounded-full overflow-hidden transition-all hover:scale-105 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative z-10">Book a Demo</span>
            <ChevronRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden relative z-50 p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute top-0 left-0 right-0 bg-white/95 backdrop-blur-xl h-screen pt-24 px-6 md:hidden border-b border-slate-200"
          >
            <div className="flex flex-col space-y-2">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    href={link.href}
                    className="text-2xl font-semibold text-slate-800 hover:text-blue-600 block py-4 border-b border-slate-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="pt-8 flex flex-col gap-4"
              >
                <Link
                  href="/auth/login"
                  className="text-lg font-medium text-slate-700 py-3 rounded-2xl bg-slate-50 text-center border border-slate-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  href="#demo"
                  className="text-lg font-medium text-white bg-slate-900 py-3 rounded-2xl text-center shadow-lg shadow-slate-900/20"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Book a Demo
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
