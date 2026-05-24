import { useEffect } from 'react';
import { Seo } from '@/components/Seo';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';
import { AppIcon } from "shared/ui/AppIcon";

const contactMethods = [
  {
    icon: "MessageCircle",
    title: 'WhatsApp',
    description: 'Chat with us directly for quick responses and instant support.',
    action: 'Message on WhatsApp',
    href: 'https://wa.me/923064944326',
    color: 'bg-emerald-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  {
    icon: "Mail",
    title: 'Email',
    description: 'Send us a detailed message and we will respond within 24 hours.',
    action: 'Send Email',
    href: 'mailto:plexotecnologies@gmail.com',
    color: 'bg-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  {
    icon: "Phone",
    title: 'Phone',
    description: 'Call us directly for urgent inquiries or immediate assistance.',
    action: '+92 306 4944326',
    href: 'tel:+923064944326',
    color: 'bg-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
  {
    icon: "MapPin",
    title: 'Location',
    description: 'Based in Pakistan, serving schools worldwide.',
    action: 'Pakistan (Remote-First)',
    href: '#',
    color: 'bg-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
];

const faqs = [
  {
    question: 'How quickly do you respond?',
    answer: 'We typically respond within 1-2 hours during business hours (9 AM - 6 PM PKT). For urgent matters, WhatsApp is the fastest channel.',
  },
  {
    question: 'Do you offer on-site demos?',
    answer: 'Yes, for schools in Pakistan we can arrange on-site demos. For international schools, we conduct virtual demos via video call.',
  },
  {
    question: 'What information should I provide when contacting?',
    answer: 'Please share your school name, approximate student count, and any specific challenges you are facing. This helps us prepare the most relevant solution for you.',
  },
];

export function ContactPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Seo
        title="Contact EduPlexo — School Management System Support"
        description="Contact EduPlexo for school management system inquiries, demos, and support. WhatsApp, email, and phone available. Based in Pakistan, serving schools worldwide."
        keywords="contact EduPlexo, school management system support, school ERP contact, EduPlexo Pakistan, school software support"
        canonical="https://www.eduplexo.com/contact"
        ogTitle="Contact EduPlexo — Get in Touch"
        ogDescription="Contact EduPlexo for school management system inquiries, demos, and support. Multiple channels available."
      />
      <Navbar />

      <header className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-100/60 via-slate-50 to-slate-50" />
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-blue-600 mb-5">
            Get in Touch
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            Contact <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">EduPlexo</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Have questions about our school management system? Need a demo or support? We are here to help. Reach out through any channel below.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {contactMethods.map((method, index) => (
            <motion.a
              key={index}
              href={method.href}
              target={method.href.startsWith('http') ? '_blank' : undefined}
              rel={method.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-start gap-4 p-6 ${method.bg} ${method.border} border rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}
            >
              <div className={`w-12 h-12 rounded-xl ${method.color} flex items-center justify-center flex-shrink-0`}>
                <AppIcon name={method.icon} className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">{method.title}</h2>
                <p className="text-slate-600 text-sm mb-2">{method.description}</p>
                <span className="text-blue-600 font-semibold text-sm">{method.action}</span>
              </div>
            </motion.a>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-2xl border border-slate-200/60 p-8 md:p-12 max-w-3xl mx-auto"
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-slate-200 pb-6 last:border-0 last:pb-0">
                <h3 className="text-lg font-bold text-slate-900 mb-2">{faq.question}</h3>
                <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
