/**
 * Lenis-powered smooth scroll engine.
 *
 * Drives the entire landing page with momentum-based scrolling,
 * exposes scroll velocity to a CSS variable so any element can react
 * to scroll speed, and respects prefers-reduced-motion.
 *
 * GSAP ScrollTrigger and Framer's useScroll continue to work because
 * Lenis raf-syncs with the native scroll position.
 */

import { useEffect } from "react";
import Lenis from "lenis";

export const SmoothScroll = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    // Honor reduced-motion preferences — no Lenis, no smooth, no momentum.
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      document.documentElement.style.scrollBehavior = "auto";
      return;
    }

    // Tune for a luxurious, weighty feel — closer to Apple/Linear than
    // the default. Higher duration = more glide; lower lerp = snappier.
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expoOut
      lerp: 0.1,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.4,
      smoothWheel: true,
    });

    let lastY = 0;
    function raf(time: number) {
      lenis.raf(time);
      // Expose normalized scroll velocity (0 → ~1) for css/jsx consumers.
      const cur = lenis.scroll;
      const dy = Math.abs(cur - lastY);
      lastY = cur;
      const v = Math.min(dy / 60, 1);
      document.documentElement.style.setProperty("--scroll-velocity", String(v));
      rafId = requestAnimationFrame(raf);
    }
    let rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      document.documentElement.style.removeProperty("--scroll-velocity");
    };
  }, []);

  return <>{children}</>;
};
