import { useEffect } from 'react';
import { Seo } from '@/components/Seo';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';
import { AppIcon } from "shared/ui/AppIcon";
import { whatsappUrl, WhatsappMessages } from '@/lib/whatsapp';
import { SIGNUP_URL } from '@/lib/config';

const features = [
  {
    icon: "Users",
    title: 'Student Information System',
    description:
      'Complete 360-degree view of student profiles, academic history, behavioral records, and enrollment data in one unified dashboard. Manage admissions, transfers, and graduations seamlessly.',
    color: 'from-blue-500 to-indigo-500',
    details: ['Admission management', 'Student profiles', 'Academic history', 'Behavioral tracking', 'Document management'],
  },
  {
    icon: "CalendarCheck",
    title: 'Automated Attendance Tracking',
    description:
      'Lightning-fast attendance taking with real-time syncing to parent portals and automated absence alerts. Support for biometric, RFID, and manual entry methods.',
    color: 'from-emerald-400 to-teal-500',
    details: ['Biometric integration', 'RFID support', 'Real-time alerts', 'Parent notifications', 'Attendance reports'],
  },
  {
    icon: "CreditCard",
    title: 'Fee Management & Online Payments',
    description:
      'Streamline fee collection with automated invoicing, online payment gateways, installment plans, and instant receipts. Track dues, generate ledgers, and send payment reminders automatically.',
    color: 'from-amber-400 to-orange-500',
    details: ['Online payments', 'Auto invoicing', 'Installment plans', 'Fee ledgers', 'Payment reminders'],
  },
  {
    icon: "LayoutDashboard",
    title: 'Parent Portal & Mobile App',
    description:
      'Keep parents engaged with real-time access to grades, attendance, fee status, homework, and school announcements. Available as web portal and mobile app for iOS and Android.',
    color: 'from-purple-500 to-pink-500',
    details: ['Real-time updates', 'Mobile app', 'Grade access', 'Fee tracking', 'Communication hub'],
  },
  {
    icon: "BookOpen",
    title: 'Teacher Dashboard & Tools',
    description:
      'Empower educators with intuitive tools for lesson planning, grading, classroom management, and student performance tracking. Reduce administrative workload by 70%.',
    color: 'from-cyan-400 to-blue-500',
    details: ['Lesson planning', 'Grade management', 'Classroom tools', 'Performance tracking', 'Time-saving automation'],
  },
  {
    icon: "GraduationCap",
    title: 'Exam Management & Report Cards',
    description:
      'Generate beautiful, compliant report cards with dynamic grading scales, customized comments, and automated calculations. Support for multiple exam patterns and grading systems.',
    color: 'from-rose-400 to-red-500',
    details: ['Exam scheduling', 'Grade computation', 'Report cards', 'Transcript generation', 'Multiple grading systems'],
  },
  {
    icon: "BarChart3",
    title: 'Advanced Analytics & Reports',
    description:
      'Turn school data into actionable insights with powerful visual reporting, trend analysis, and AI-powered predictions. Make data-driven decisions for institutional growth.',
    color: 'from-indigo-400 to-violet-500',
    details: ['Visual dashboards', 'Trend analysis', 'AI predictions', 'Custom reports', 'Data export'],
  },
  {
    icon: "BellRing",
    title: 'Smart Notifications & Communication',
    description:
      'Instant multi-channel communication via SMS, email, push notifications, and WhatsApp for urgent updates, event reminders, and automated alerts. Never miss critical communication.',
    color: 'from-yellow-400 to-amber-500',
    details: ['SMS alerts', 'Email campaigns', 'Push notifications', 'WhatsApp integration', 'Automated triggers'],
  },
];

export function FeaturesPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Seo
        title="EduPlexo Features — Complete School Management System Features"
        description="Explore all features of EduPlexo school management system: student management, attendance tracking, fee management, parent portal, teacher dashboard, exam management, analytics & more."
        keywords="school management system features, student management, attendance tracking, fee management software, parent portal, teacher dashboard, exam management, school analytics"
        canonical="https://www.eduplexo.com/features"
        ogTitle="EduPlexo Features — Complete School ERP Features"
        ogDescription="Explore all features of EduPlexo school management system. Student management, attendance, fees, parent portal, teacher tools, exams, analytics & AI."
      />
      <Navbar />

      <header className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-100/60 via-slate-50 to-slate-50" />
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-blue-600 mb-5">
            School Management System Features
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            Everything You Need to Run a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Modern School</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
            EduPlexo brings all your core school operations into one beautifully designed platform. From admissions to report cards, every feature is built for efficiency.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="bg-white rounded-2xl p-8 border border-slate-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-sm`}>
                <AppIcon name={feature.icon} className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">{feature.title}</h2>
              <p className="text-slate-600 leading-relaxed mb-6">{feature.description}</p>
              <ul className="space-y-2">
                {feature.details.map((detail, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                    <AppIcon name="CheckCircle2" className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    {detail}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-12 md:p-16"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Ready to Transform Your School?
          </h2>
          <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
            Start your 14-day free trial today. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={SIGNUP_URL}
              className="px-8 py-4 bg-blue-600 text-white rounded-full font-semibold shadow-lg hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center gap-2"
            >
              Start Free Trial <AppIcon name="ArrowRight" className="w-4 h-4" />
            </a>
            <a
              href={whatsappUrl(WhatsappMessages.bookDemo())}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-white/10 text-white rounded-full font-semibold border border-white/20 hover:bg-white/20 hover:-translate-y-1 transition-all"
            >
              Book a Demo
            </a>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
