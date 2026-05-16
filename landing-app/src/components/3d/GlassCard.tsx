/**
 * GlassCard — frosted glass panel with hover tilt and glow effects.
 *
 * Features:
 * - Backdrop blur (frosted glass)
 * - 3D tilt on hover (mouse-tracked)
 * - Inner glow that follows cursor
 * - Subtle border shimmer
 * - GPU-accelerated (transform only)
 */

import { useRef } from "react";
import { motion, useSpring, useMotionValue, useTransform } from "framer-motion";
import type { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  tiltMax?: number;
  glowColor?: string;
}

export function GlassCard({
  children,
  className = "",
  tiltMax = 6,
  glowColor = "rgba(59, 130, 246, 0.15)",
}: GlassCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(mouseY, [0, 1], [tiltMax, -tiltMax]), {
    stiffness: 200,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-tiltMax, tiltMax]), {
    stiffness: 200,
    damping: 20,
  });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  }

  function handleMouseLeave() {
    mouseX.set(0.5);
    mouseY.set(0.5);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 1000,
        transformStyle: "preserve-3d",
      }}
      className={`
        relative overflow-hidden rounded-2xl
        bg-white/60 backdrop-blur-xl
        border border-white/40
        shadow-[0_8px_32px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.8)]
        transition-shadow duration-300
        hover:shadow-[0_16px_48px_rgba(59,130,246,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]
        ${className}
      `}
    >
      {/* Cursor-following glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300"
        style={{
          background: useTransform(
            [mouseX, mouseY],
            ([x, y]) =>
              `radial-gradient(400px circle at ${(x as number) * 100}% ${(y as number) * 100}%, ${glowColor}, transparent 60%)`
          ),
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
