import { useEffect } from 'react';
import { Seo } from '@/components/Seo';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, CheckCircle2, MessageCircle, Mail } from '@/components/icons';
import { whatsappUrl, WhatsappMessages } from '@/lib/whatsapp';

const benefits = [
  {
    icon: Calendar,
    title: 'Personalized Walkthrough',
    description: 'See exactly how EduPlexo works for your specific school size, structure, and requirements.',
  },
  {
    icon: Clock,
    title: '30-Minute Session',
    description: 'Focused, efficient demo covering the features that matter most to your institution.',
  },
  {
    icon: Users,
    title: 'Expert Guidance',
    description: 'Our education technology specialists will answer all your questions and address concerns.',
  },
];

const faqs = [
  {
    question: 'Is the demo free?',
    answer: 'Yes, absolutely. The demo is completely free with no obligation. It is a 30-minute personalized walkthrough of the EduPlexo platform tailored to your school needs.',
  },
  {
    question: 'What happens after the demo?',
    answer: 'After the demo, you will receive a free trial account to explore EduPlexo on your own. Our team will be available to help with any questions during your trial period.',
  },
  {
    question: 'Can I see features specific to my school type?',
    answer: 'Yes! Before the demo, we will ask about your school size, type, and specific needs so we can customize the walkthrough to show the most relevant features.',
  },
  {
    question: 'Do I need to prepare anything?',
    answer: 'No preparation needed. Just bring your questions and any specific challenges your school faces. We will show you how EduPlexo addresses each one.',
  },
];

export function BookDemoPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Seo
        title="Book a Demo — EduPlexo School Management System Demo"
        description="Book a free personalized demo of EduPlexo school management system. See how our AI-powered school ERP can transform your institution. 30-minute session with our experts."
        keywords="book school management demo, school ERP demo, EduPlexo demo, free school software demo, school management system trial"
        canonical="https://www.eduplexo.com/book-demo"
        ogTitle="Book a Free EduPlexo Demo — School Management System"
        ogDescription="Book a free personalized demo of EduPlexo. See how our AI-powered school ERP can transform your institution in 30 minutes."
      />
      <Navbar />

      <header className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-100/60 via-slate-50 to-slate-50" />
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-blue-600 mb-5">
            Free Personalized Demo
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            See EduPlexo <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">In Action</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Book a free 30-minute demo with our education technology specialists. We will show you exactly how EduPlexo can transform your school operations.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-8">What You Will Get</h2>
            <div className="space-y-6 mb-12">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-4 p-6 bg-white rounded-2xl border border-slate-200/60 shadow-sm"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">{benefit.title}</h3>
                    <p className="text-slate-600">{benefit.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-white mb-6">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index} className="border-b border-white/10 pb-4 last:border-0 last:pb-0">
                    <h3 className="font-semibold text-white mb-2">{faq.question}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl border border-slate-200/60 shadow-lg p-8 sticky top-28"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Book Your Demo</h2>
              <p className="text-slate-600 mb-8">Choose your preferred way to connect with us.</p>

              <div className="space-y-4">
                <a
                  href={whatsappUrl(WhatsappMessages.bookDemo())}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 w-full p-5 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-slate-900">WhatsApp</div>
                    <div className="text-sm text-slate-600">Quick response, chat anytime</div>
                  </div>
                </a>

                <a
                  href="mailto:plexotecnologies@gmail.com?subject=Demo Request - EduPlexo"
                  className="flex items-center gap-4 w-full p-5 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-slate-900">Email</div>
                    <div className="text-sm text-slate-600">plexotecnologies@gmail.com</div>
                  </div>
                </a>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200">
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Free 30-minute session
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  No obligation or commitment
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Free trial account included
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
