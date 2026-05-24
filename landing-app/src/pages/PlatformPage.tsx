import { useEffect } from 'react';
import { Seo } from '@/components/Seo';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';
import { AppIcon } from "shared/ui/AppIcon";
import { whatsappUrl, WhatsappMessages } from '@/lib/whatsapp';
import { SIGNUP_URL } from '@/lib/config';

const platformModules = [
  {
    icon: "Layout",
    title: 'Admin Dashboard',
    description: 'Centralized command center for school administrators. Monitor all operations, manage staff permissions, configure system settings, and access real-time institutional analytics from a single interface.',
    features: ['Multi-campus oversight', 'Role-based permissions', 'System configuration', 'Real-time monitoring', 'Audit logs'],
    image: '/admin-preview.png',
  },
  {
    icon: "LineChart",
    title: 'Analytics & Intelligence',
    description: 'Transform raw school data into actionable insights with AI-powered analytics. Track enrollment trends, predict fee collection, identify at-risk students, and generate comprehensive institutional reports.',
    features: ['Visual dashboards', 'Predictive analytics', 'Custom reports', 'Data export', 'Trend analysis'],
    image: '/analytics-preview.png',
  },
  {
    icon: "Users",
    title: 'Student Records Management',
    description: 'Complete digital lifecycle management for every student from admission to graduation. Store academic records, attendance history, behavioral notes, medical information, and parent contacts securely.',
    features: ['Digital profiles', 'Academic history', 'Document storage', 'Medical records', 'Parent contacts'],
    image: '/students-preview.png',
  },
  {
    icon: "Shield",
    title: 'Security & Access Control',
    description: 'Enterprise-grade security with bank-level encryption, tenant isolation, and granular access controls. Every data point is protected with role-based permissions and comprehensive audit trails.',
    features: ['AES-256 encryption', 'Tenant isolation', 'Access controls', 'Audit trails', 'Data backups'],
    image: '/security-preview.png',
  },
  {
    icon: "MessageSquare",
    title: 'Plexa AI Command Agent',
    description: 'Your conversational AI assistant that understands natural language queries about your school. Ask about attendance, fees, students, or any metric and get instant answers with actionable recommendations.',
    features: ['Natural language queries', 'Instant analytics', 'Proactive alerts', 'Automated actions', 'Role-based intelligence'],
    image: '/ai-preview.png',
  },
];

export function PlatformPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Seo
        title="EduPlexo Platform — School ERP Platform Overview"
        description="Explore the EduPlexo school ERP platform: admin dashboard, analytics, student records, security controls, and AI command agent. Built for modern educational institutions."
        keywords="school ERP platform, school management platform, education ERP, admin dashboard, school analytics, student records, school security, AI school management"
        canonical="https://www.eduplexo.com/platform"
        ogTitle="EduPlexo Platform — Complete School ERP Platform"
        ogDescription="Explore the EduPlexo school ERP platform with admin dashboard, analytics, student records, security, and AI agent."
      />
      <Navbar />

      <header className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-100/60 via-slate-50 to-slate-50" />
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-blue-600 mb-5">
            School ERP Platform
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            A Unified Platform for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Every School Role</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
            EduPlexo is not just software — it is a complete operating system for educational institutions. Every module is designed to work together seamlessly.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pb-24">
        <div className="space-y-20">
          {platformModules.map((module, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`flex flex-col ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-12 items-center`}
            >
              <div className="flex-1">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mb-6 shadow-sm`}>
                  <AppIcon name={module.icon} className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">{module.title}</h2>
                <p className="text-lg text-slate-600 leading-relaxed mb-6">{module.description}</p>
                <ul className="space-y-3">
                  {module.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-slate-700">
                      <AppIcon name="CheckCircle2" className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex-1 w-full">
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-lg overflow-hidden">
                  <img
                    src={module.image}
                    alt={`EduPlexo ${module.title} — School Management System Platform`}
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 text-center"
        >
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">See the Platform in Action</h2>
          <p className="text-lg text-slate-600 mb-8 max-w-xl mx-auto">
            Schedule a personalized demo and discover how EduPlexo can transform your school operations.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={whatsappUrl(WhatsappMessages.bookDemo())}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-blue-600 text-white rounded-full font-semibold shadow-lg hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center gap-2"
            >
              Book a Demo <AppIcon name="ArrowRight" className="w-4 h-4" />
            </a>
            <a
              href={SIGNUP_URL}
              className="px-8 py-4 bg-white text-slate-900 rounded-full font-semibold border border-slate-200 hover:border-blue-200 hover:text-blue-600 hover:-translate-y-1 transition-all"
            >
              Start Free Trial
            </a>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
