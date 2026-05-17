import { motion } from "framer-motion";
import { Book, GraduationCap, PenTool, Atom, Sparkles } from "@/components/icons";

export default function AestheticAuthGraphic() {
  return (
    <div className="relative w-full h-[400px] flex items-center justify-center overflow-visible">
      {/* Central Floating Element (Graduation Cap) */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative z-20"
      >
        <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[40px] shadow-[0_30px_60px_rgba(0,0,0,0.1)] border border-white/20 relative group">
          <GraduationCap size={120} className="text-blue-600 group-hover:scale-110 transition-transform duration-500" strokeWidth={1.5} />
          
          {/* Subtle Glow */}
          <div className="absolute inset-0 bg-blue-400/20 blur-[60px] rounded-full -z-10 animate-pulse" />
        </div>
      </motion.div>

      {/* Floating Book 1 */}
      <motion.div
        animate={{
          y: [0, 30, 0],
          x: [0, 15, 0],
          rotate: [0, -10, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
        className="absolute top-10 left-10 z-10"
      >
        <div className="bg-white/80 backdrop-blur-lg p-5 rounded-3xl shadow-xl border border-white/30">
          <Book size={48} className="text-pink-500" strokeWidth={1.5} />
        </div>
      </motion.div>

      {/* Floating Book 2 */}
      <motion.div
        animate={{
          y: [0, -30, 0],
          x: [0, -15, 0],
          rotate: [0, 15, 0],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className="absolute bottom-10 right-10 z-10"
      >
        <div className="bg-white/80 backdrop-blur-lg p-6 rounded-[30px] shadow-xl border border-white/30">
          <Atom size={56} className="text-blue-400" strokeWidth={1.5} />
        </div>
      </motion.div>

      {/* Floating Pen */}
      <motion.div
        animate={{
          y: [0, 40, 0],
          rotate: [0, 20, 0],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.5,
        }}
        className="absolute top-1/2 -left-20 z-10"
      >
        <div className="bg-white/90 backdrop-blur-lg p-4 rounded-full shadow-lg border border-white/40">
          <PenTool size={32} className="text-orange-400" strokeWidth={2} />
        </div>
      </motion.div>

      {/* Sparkles / Particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1],
            y: [0, -100, 0],
            x: [0, (i % 2 === 0 ? 50 : -50), 0],
          }}
          transition={{
            duration: 5 + i,
            repeat: Infinity,
            delay: i * 0.8,
          }}
          className="absolute"
          style={{
            top: `${20 + i * 15}%`,
            left: `${10 + i * 15}%`,
          }}
        >
          <Sparkles size={16} className="text-blue-200" fill="currentColor" />
        </motion.div>
      ))}

      {/* Background Decorative Circles */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-100/30 rounded-full blur-[120px] -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-pink-100/20 rounded-full blur-[100px] -z-10" />
    </div>
  );
}
