import { useEffect } from 'react';
import { Seo } from '@/components/Seo';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight } from '@/components/icons';

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  author: string;
  authorRole: string;
}

const posts: BlogPost[] = [
  {
    slug: 'best-school-management-system-pakistan',
    title: 'Best School Management System in Pakistan 2026: Complete Guide',
    excerpt: 'Discover why EduPlexo is ranked as the #1 school management system in Pakistan. Compare features, pricing, and benefits of top school ERP solutions for Pakistani institutions.',
    date: 'May 21, 2026',
    readTime: '12 min read',
    category: 'School ERP',
    author: 'EduPlexo Team',
    authorRole: 'Education Technology Experts',
  },
  {
    slug: 'how-school-erp-improves-operations',
    title: 'How School ERP Improves Daily Operations: A Complete Guide',
    excerpt: 'Learn how implementing a school ERP system can streamline administrative tasks, improve communication, reduce costs, and enhance the overall efficiency of your educational institution.',
    date: 'May 18, 2026',
    readTime: '10 min read',
    category: 'Operations',
    author: 'EduPlexo Team',
    authorRole: 'Education Technology Experts',
  },
  {
    slug: 'benefits-parent-portal-modern-schools',
    title: 'Benefits of Parent Portal in Modern Schools',
    excerpt: 'Explore how parent portals transform school-home communication, increase parent engagement, and improve student outcomes in modern educational institutions.',
    date: 'May 15, 2026',
    readTime: '8 min read',
    category: 'Parent Engagement',
    author: 'EduPlexo Team',
    authorRole: 'Education Technology Experts',
  },
  {
    slug: 'school-attendance-management-guide',
    title: 'School Attendance Management: The Complete Guide for 2026',
    excerpt: 'Everything you need to know about modern attendance management systems for schools. From biometric tracking to AI-powered absence prediction.',
    date: 'May 12, 2026',
    readTime: '11 min read',
    category: 'Attendance',
    author: 'EduPlexo Team',
    authorRole: 'Education Technology Experts',
  },
  {
    slug: 'how-to-choose-school-management-software',
    title: 'How to Choose the Right School Management Software',
    excerpt: 'A step-by-step guide to selecting the perfect school management software for your institution. Key features to look for, questions to ask, and pitfalls to avoid.',
    date: 'May 9, 2026',
    readTime: '9 min read',
    category: 'Buying Guide',
    author: 'EduPlexo Team',
    authorRole: 'Education Technology Experts',
  },
  {
    slug: 'ai-in-school-management',
    title: 'AI in School Management: Transforming Education Technology',
    excerpt: 'How artificial intelligence is revolutionizing school management systems. From predictive analytics to automated insights, discover the future of education ERP.',
    date: 'May 6, 2026',
    readTime: '10 min read',
    category: 'AI & Technology',
    author: 'EduPlexo Team',
    authorRole: 'Education Technology Experts',
  },
  {
    slug: 'future-of-school-erp',
    title: 'The Future of School ERP: Trends Shaping Education in 2026 and Beyond',
    excerpt: 'Explore the emerging trends in school ERP systems including AI integration, cloud migration, mobile-first design, and data-driven decision making.',
    date: 'May 3, 2026',
    readTime: '8 min read',
    category: 'Future Trends',
    author: 'EduPlexo Team',
    authorRole: 'Education Technology Experts',
  },
];

export function BlogIndexPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Seo
        title="EduPlexo Blog — School Management System Insights & Guides"
        description="Read the latest insights, guides, and trends about school management systems, school ERP, education technology, and AI in education from EduPlexo experts."
        keywords="school management blog, school ERP guide, education technology trends, AI in education, school automation tips, parent portal benefits"
        canonical="https://www.eduplexo.com/blog"
        ogTitle="EduPlexo Blog — School Management Insights"
        ogDescription="Expert insights on school management systems, ERP implementation, education technology trends, and AI in education."
      />
      <Navbar />

      <header className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-100/60 via-slate-50 to-slate-50" />
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-blue-600 mb-5">
            EduPlexo Blog
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            Insights for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Modern Schools</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Expert guides, industry insights, and practical tips for school administrators, teachers, and education technology leaders.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post, index) => (
            <motion.article
              key={post.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
            >
              <div className="h-48 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                <span className="text-4xl font-extrabold text-blue-200">
                  {post.category.charAt(0)}
                </span>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    {post.category}
                  </span>
                </div>
                <Link to={`/blog/${post.slug}`} className="block">
                  <h2 className="text-xl font-bold text-slate-900 mb-3 hover:text-blue-600 transition-colors line-clamp-2">
                    {post.title}
                  </h2>
                </Link>
                <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-1 line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                      {post.author.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900">{post.author}</div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" />
                        {post.date}
                      </div>
                    </div>
                  </div>
                  <Link
                    to={`/blog/${post.slug}`}
                    className="text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-12 md:p-16"
        >
          <h2 className="text-3xl font-extrabold text-white mb-4">Ready to Transform Your School?</h2>
          <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
            Start your 14-day free trial and experience the future of school management.
          </p>
          <a
            href="/book-demo"
            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-full font-semibold shadow-lg hover:bg-blue-700 hover:-translate-y-1 transition-all"
          >
            Book a Demo <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
