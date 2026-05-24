/**
 * Navbar.
 *
 * Same visual identity as before (transparent → frosted on scroll, mobile
 * menu animation preserved). The hash anchors stay in sync with the footer
 * (`#features` / `#platform` / `#security` / `#pricing`) and use the shared
 * smooth-scroll helper so links work from any route.
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AppIcon } from "shared/ui/AppIcon";
import { motion, AnimatePresence } from 'framer-motion';

import { LOGIN_URL } from '@/lib/config';
import { makeAnchorClickHandler } from '@/lib/scroll-to';
import { whatsappUrl, WhatsappMessages } from '@/lib/whatsapp';

const NAV_LINKS = [
  { label: 'Features', hash: '#features' },
  { label: 'Platform', hash: '#platform' },
  { label: 'Security', hash: '#security' },
  { label: 'Pricing', hash: '#pricing' },
  { label: 'Blog', to: '/blog' },
];

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHome = location.pathname === '/';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/80 backdrop-blur-lg shadow-[0_4px_30px_rgba(0,0,0,0.05)] border-b border-slate-200/50'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <span className="w-10 h-10 rounded-xl overflow-hidden bg-white shadow-md ring-1 ring-slate-200 flex-shrink-0 group-hover:shadow-lg group-hover:ring-blue-200 transition-all">
            <img
              src="/logo.jpeg"
              alt="EduPlexo — AI School Management System Logo"
              className="w-full h-full object-cover"
              loading="eager"
              width="40"
              height="40"
            />
          </span>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
            EduPlexo
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
          {NAV_LINKS.map((link) =>
            link.to ? (
              <Link
                key={link.label}
                to={link.to}
                className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.hash ?? '#'}
                onClick={makeAnchorClickHandler(link.hash ?? '#', navigate)}
                className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
              >
                {link.label}
              </a>
            ),
          )}
        </nav>

        {/* Auth CTA */}
        <div className="hidden md:flex items-center gap-4">
          <a
            href={LOGIN_URL}
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-3 py-2"
          >
            Log in
          </a>
          <a
            href={whatsappUrl(WhatsappMessages.bookDemo())}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-md hover:shadow-lg px-5 py-2.5 rounded-full"
          >
            Book Demo
          </a>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <AppIcon name="X" className="w-6 h-6" /> : <AppIcon name="Menu" className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-xl md:hidden overflow-hidden"
          >
            <div className="flex flex-col p-4 space-y-1">
              {NAV_LINKS.map((link) =>
                link.to ? (
                  <Link
                    key={link.label}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-base font-medium text-slate-700 hover:text-blue-600 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.label}
                    href={link.hash ?? '#'}
                    onClick={makeAnchorClickHandler(link.hash ?? '#', navigate, () =>
                      setMobileMenuOpen(false),
                    )}
                    className="text-base font-medium text-slate-700 hover:text-blue-600 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    {link.label}
                  </a>
                ),
              )}
              <div className="h-px bg-slate-100 w-full my-3" />
              <a
                href={LOGIN_URL}
                className="text-base font-medium text-slate-700 p-3 rounded-lg hover:bg-slate-50 text-center transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Log in
              </a>
              <a
                href={whatsappUrl(WhatsappMessages.bookDemo())}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-white bg-blue-600 p-3 rounded-lg text-center shadow-md hover:shadow-lg hover:bg-blue-700 transition-all"
              >
                Book Demo
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
