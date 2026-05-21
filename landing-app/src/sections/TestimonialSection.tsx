import React from "react";
import { motion } from "framer-motion";
import { Star } from "@/components/icons";

const testimonials = [
  {
    content: "EduPlexo school management system completely transformed how we run our daily operations. Attendance takes seconds, and parent communication through the parent portal has never been easier.",
    author: "Sarah Jenkins",
    role: "School Principal, Oakridge Academy",
    avatar: "SJ"
  },
  {
    content: "Finally, a school ERP that does not feel like it was built in the 90s. The EduPlexo UI is gorgeous and incredibly intuitive for our staff. The AI features save us hours every week.",
    author: "David Chen",
    role: "IT Director, Summit Prep School",
    avatar: "DC"
  },
  {
    content: "As a teacher, I save at least 5 hours a week on administrative tasks with EduPlexo. The automated grading and report card generation in this school management software is a lifesaver.",
    author: "Elena Rodriguez",
    role: "Senior Educator, Global Heights",
    avatar: "ER"
  }
];

export const TestimonialSection = () => {
  return (
    <section id="testimonials" className="py-24 bg-slate-50 border-y border-slate-200/60" aria-labelledby="testimonials-heading">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.h2
            id="testimonials-heading"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight"
          >
            Schools Love Using EduPlexo
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-600 font-medium"
          >
            Do not just take our word for it. Hear from the administrators and teachers who use EduPlexo school management system every day.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, index) => (
            <motion.article
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="relative z-10 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex gap-1 mb-6" aria-label="5 out of 5 stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 text-lg leading-relaxed mb-8 font-medium">
                  &ldquo;{t.content}&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold shadow-sm">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-bold text-slate-900">{t.author}</div>
                  <div className="text-sm text-slate-500 font-medium">{t.role}</div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};
