import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, Hash as Twitter, Link as Linkedin, Code as Github } from "lucide-react";
// Note: Fallback icons applied for missing lucide icons
const LinkedinIcon = BookOpen;
const GithubIcon = BookOpen;

export const Footer = () => {
  return (
    <footer className="bg-slate-50 border-t border-slate-200/60 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12 mb-16">
          <div className="col-span-2 lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 group mb-4 inline-flex">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <BookOpen className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-slate-900">
                Eduplexo
              </span>
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs mb-6">
              The modern school management platform designed for administrators, teachers, and parents to collaborate effortlessly.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-slate-400 hover:text-blue-600 transition-colors">
                <span className="sr-only">Twitter</span>
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-blue-600 transition-colors">
                <span className="sr-only">LinkedIn</span>
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-slate-900 transition-colors">
                <span className="sr-only">GitHub</span>
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Product</h3>
            <ul className="space-y-3">
              <li><Link to="#features" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">Features</Link></li>
              <li><Link to="#dashboard" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">Platform</Link></li>
              <li><Link to="#security" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">Security</Link></li>
              <li><Link to="#pricing" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">Pricing</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Company</h3>
            <ul className="space-y-3">
              <li><Link to="#" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">About Us</Link></li>
              <li><Link to="#" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">Careers</Link></li>
              <li><Link to="#" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">Blog</Link></li>
              <li><Link to="#" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-4">Legal</h3>
            <ul className="space-y-3">
              <li><Link to="#" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">Privacy Policy</Link></li>
              <li><Link to="#" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">Terms of Service</Link></li>
              <li><Link to="#" className="text-sm text-slate-500 hover:text-blue-600 transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200/60 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Eduplexo Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Designed with</span>
            <span className="text-red-500">♥</span>
            <span>for schools worldwide</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
