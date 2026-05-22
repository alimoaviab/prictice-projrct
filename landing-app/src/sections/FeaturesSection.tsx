import React from "react";
import { motion } from "framer-motion";
import {
  Users,
  CalendarCheck,
  CreditCard,
  LayoutDashboard,
  BookOpen,
  BarChart3,
  BellRing,
  GraduationCap
} from "@/components/icons";

const features = [
  {
    icon: Users,
    title: "Student Management System",
    description: "Complete 360-degree view of student profiles, academic history, and behavioral records in one unified school management dashboard.",
    color: "from-blue-500 to-indigo-500"
  },
  {
    icon: CalendarCheck,
    title: "Automated Attendance Tracking",
    description: "Lightning-fast attendance taking with real-time syncing to parent portals and automated absence alerts for your school ERP.",
    color: "from-emerald-400 to-teal-500"
  },
  {
    icon: CreditCard,
    title: "Fee Management & Online Payments",
    description: "Streamline fee collection with automated invoicing, online payment gateways, and instant receipts in your school management software.",
    color: "from-amber-400 to-orange-500"
  },
  {
    icon: LayoutDashboard,
    title: "Parent Portal & Mobile App",
    description: "Keep parents engaged with real-time access to grades, attendance, and school announcements through the EduPlexo parent portal.",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: BookOpen,
    title: "Teacher Dashboard & Tools",
    description: "Empower educators with intuitive tools for lesson planning, grading, and classroom management in the teacher portal.",
    color: "from-cyan-400 to-blue-500"
  },
  {
    icon: GraduationCap,
    title: "Exam Management & Report Cards",
    description: "Generate beautiful, compliant report cards with dynamic grading scales and customized comments using school exam management software.",
    color: "from-rose-400 to-red-500"
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics & Reports",
    description: "Turn school data into actionable insights with powerful visual reporting and trend analysis in your education ERP dashboard.",
    color: "from-indigo-400 to-violet-500"
  },
  {
    icon: BellRing,
    title: "Smart Notifications & Communication",
    description: "Instant multi-channel communication via SMS, email, and push notifications for urgent school updates and automated alerts.",
    color: "from-yellow-400 to-amber-500"
  }
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-slate-50" aria-labelledby="features-heading">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2
            id="features-heading"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight"
          >
            Complete School Management System <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Features</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-600 font-medium"
          >
            EduPlexo school ERP brings all your core operations into one beautifully designed platform. Say goodbye to fragmented systems.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.article
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-2xl hover:-translate-y-2 group-hover:bg-gradient-to-br group-hover:from-white group-hover:to-slate-50 transition-all duration-300 group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                {feature.title}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                {feature.description}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};
