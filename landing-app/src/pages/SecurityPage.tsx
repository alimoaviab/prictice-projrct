import { useEffect } from 'react';
import { Seo } from '@/components/Seo';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';
import { AppIcon } from "shared/ui/AppIcon";
import { whatsappUrl, WhatsappMessages } from '@/lib/whatsapp';
import { SIGNUP_URL } from '@/lib/config';

const securityFeatures = [
  {
    icon: "Lock",
    title: 'AES-256 Encryption',
    description: 'All data is encrypted at rest and in transit using military-grade AES-256 encryption. Your school data is protected with the same security standards used by banks and government institutions.',
  },
  {
    icon: "ShieldCheck",
    title: 'Role-Based Access Control',
    description: 'Granular permission system ensures each user only accesses what they need. Administrators can define custom roles for teachers, parents, students, and staff with precise data visibility controls.',
  },
  {
    icon: "Database",
    title: 'Tenant Data Isolation',
    description: 'Each school data is completely isolated from every other tenant on the platform. No cross-tenant data access is possible, ensuring your institution data remains private and secure.',
  },
  {
    icon: "Key",
    title: 'Multi-Factor Authentication',
    description: 'Optional two-factor authentication adds an extra layer of security for all user accounts. Protect against unauthorized access with SMS or app-based verification codes.',
  },
  {
    icon: "Eye",
    title: 'Comprehensive Audit Logs',
    description: 'Every action in the system is logged with timestamps, user IDs, and IP addresses. Administrators can review complete audit trails for compliance, security investigations, and accountability.',
  },
  {
    icon: "Server",
    title: 'Automated Daily Backups',
    description: 'Your data is backed up automatically every day with multiple redundant copies stored in geographically distributed data centers. Recovery is fast and guaranteed in case of any incident.',
  },
];

const complianceItems = [
  'GDPR-compliant data handling',
  'FERPA-aligned student data protection',
  'SOC 2 Type II infrastructure',
  '99.99% uptime SLA guarantee',
  'Regular security audits and penetration testing',
  'ISO 27001 certified data centers',
];

export function SecurityPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Seo
        title="EduPlexo Security — Enterprise-Grade School Data Security"
        description="EduPlexo provides enterprise-grade security for school data: AES-256 encryption, role-based access, tenant isolation, MFA, audit logs, and daily backups. GDPR & FERPA compliant."
        keywords="school data security, school ERP security, student data protection, AES-256 encryption, role-based access control, GDPR compliant school software, FERPA compliance"
        canonical="https://www.eduplexo.com/security"
        ogTitle="EduPlexo Security — Enterprise-Grade School Data Protection"
        ogDescription="Enterprise-grade security for school data with AES-256 encryption, role-based access, tenant isolation, MFA, and daily backups."
      />
      <Navbar />

      <header className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-100/60 via-slate-50 to-slate-50" />
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-blue-600 mb-5">
            Enterprise Security
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            Your School Data is <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Protected</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
            EduPlexo uses bank-grade security measures to protect every byte of your institution data. From encryption to access controls, security is built into every layer.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {securityFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="bg-white rounded-2xl p-8 border border-slate-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-6">
                <AppIcon name={feature.icon} className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h2>
              <p className="text-slate-600 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-12 md:p-16"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-white mb-6">Security Compliance & Certifications</h2>
              <p className="text-slate-400 text-lg mb-8 leading-relaxed">
                EduPlexo meets global standards for data protection and educational privacy. Your school data is handled with the highest level of care and compliance.
              </p>
              <ul className="space-y-4">
                {complianceItems.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <AppIcon name="CheckCircle2" className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-center">
              <div className="text-6xl font-extrabold text-white mb-2">99.99%</div>
              <div className="text-slate-400 text-lg mb-8">Uptime Guarantee</div>
              <a
                href={whatsappUrl(WhatsappMessages.bookDemo())}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-full font-semibold shadow-lg hover:bg-blue-700 hover:-translate-y-1 transition-all"
              >
                Discuss Security <AppIcon name="ArrowRight" className="w-4 h-4" />
              </a>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
