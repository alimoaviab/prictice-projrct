/**
 * Reusable motion primitives for the landing page.
 *
 * Everything here is GPU-accelerated (transform/opacity only),
 * respects prefers-reduced-motion, and uses Framer Motion springs
 * tuned for a premium SaaS feel.
 */

import {
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useScroll,
  useInView,
} from "framer-motion";

// ─── Magnetic Button ─────────────────────────────────────────────────────

/**
 * Subtle cursor-attracting button. Pulls toward the cursor while hovered,
 * snaps back on leave. Pure transforms — no layout shift.
 */
export function Magnetic({
  children,
  strength = 0.35,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(0, { stiffness: 220, damping: 18, mass: 0.4 });
  const y = useSpring(0, { stiffness: 220, damping: 18, mass: 0.4 });

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) * strength;
    const dy = (e.clientY - (r.top + r.height / 2)) * strength;
    x.set(dx);
    y.set(dy);
  }
  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ x, y }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── 3D Tilt Card with spotlight ─────────────────────────────────────────

/**
 * Card that tilts in 3D following the cursor and exposes a CSS
 * spotlight (--mx, --my) for a radial glow that tracks the pointer.
 */
export function TiltCard({
  children,
  className = "",
  max = 8,
  spotlight = true,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  spotlight?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useSpring(0, { stiffness: 180, damping: 16 });
  const ry = useSpring(0, { stiffness: 180, damping: 16 });

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width; // 0..1
    const py = (e.clientY - r.top) / r.height; // 0..1
    ry.set((px - 0.5) * 2 * max);
    rx.set(-(py - 0.5) * 2 * max);
    if (spotlight) {
      el.style.setProperty("--mx", `${px * 100}%`);
      el.style.setProperty("--my", `${py * 100}%`);
    }
  }
  function handleLeave() {
    rx.set(0);
    ry.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        rotateX: rx,
        rotateY: ry,
        transformPerspective: 900,
        transformStyle: "preserve-3d",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Reveal on scroll (replaces ad-hoc whileInView) ──────────────────────

export function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.7,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Count-up animated number ────────────────────────────────────────────

/**
 * Scroll-triggered count-up. Parses the numeric portion of the value
 * (e.g. "2M+" → 2) and animates it. Suffix/prefix preserved.
 */
export function CountUp({
  value,
  duration = 1.4,
  className,
}: {
  value: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [display, setDisplay] = useState("0");

  // Parse out a numeric leading portion + suffix.
  const { num, suffix, prefix } = useMemo(() => {
    const m = value.match(/^([^\d.-]*)([\d.,]+)(.*)$/);
    if (!m) return { prefix: "", num: NaN, suffix: value };
    return {
      prefix: m[1] ?? "",
      num: parseFloat(m[2].replace(/,/g, "")),
      suffix: m[3] ?? "",
    };
  }, [value]);

  useEffect(() => {
    if (!inView || Number.isNaN(num)) {
      if (Number.isNaN(num)) setDisplay(value);
      return;
    }
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      const cur = num * eased;
      const formatted =
        num >= 1000 && Number.isInteger(num)
          ? Math.round(cur).toLocaleString()
          : cur.toFixed(num < 10 && !Number.isInteger(num) ? 1 : 0);
      setDisplay(`${prefix}${formatted}${suffix}`);
      if (p < 1) requestAnimationFrame(tick);
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, num, suffix, prefix, duration, value]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}

// ─── Infinite Marquee ────────────────────────────────────────────────────

/**
 * Continuous horizontal scroll. Duplicates content once for a seamless
 * loop. Pauses on hover. Pure transform — runs on the compositor thread.
 */
export function Marquee({
  children,
  speed = 50,
  pauseOnHover = true,
  className = "",
  reverse = false,
}: {
  children: ReactNode;
  speed?: number;
  pauseOnHover?: boolean;
  className?: string;
  reverse?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={
        {
          ["--marquee-speed" as any]: `${speed}s`,
        } as any
      }
    >
      <div
        className={`flex gap-16 w-max ${
          reverse ? "marquee-reverse" : "marquee"
        } ${pauseOnHover ? "marquee-pause-on-hover" : ""}`}
      >
        <div className="flex gap-16 shrink-0">{children}</div>
        <div className="flex gap-16 shrink-0" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Parallax wrapper ────────────────────────────────────────────────────

/**
 * Translates children vertically based on scroll progress through the
 * viewport. `speed` of 0.5 means it moves at half the scroll rate.
 */
export function Parallax({
  children,
  speed = 0.3,
  className,
}: {
  children: ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", `${speed * 100}%`]);
  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

// ─── Mouse-tracked spotlight (full-section) ──────────────────────────────

/**
 * Tracks the mouse globally inside the wrapped element and exposes
 * `--mx`/`--my` (in %) so descendants can render a radial gradient
 * that follows the cursor. Used for hero / cta backgrounds.
 */
export function CursorSpotlight({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const mx = useMotionValue(50);
  const my = useMotionValue(50);

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width) * 100);
    my.set(((e.clientY - r.top) / r.height) * 100);
  }

  return (
    <motion.div
      onMouseMove={handleMove}
      style={
        {
          ["--mx" as any]: useTransform(mx, (v) => `${v}%`),
          ["--my" as any]: useTransform(my, (v) => `${v}%`),
        } as any
      }
      className={className}
    >
      {children}
    </motion.div>
  );
}
