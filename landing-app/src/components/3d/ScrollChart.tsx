/**
 * ScrollChart — SVG chart that animates its stroke as the user scrolls.
 *
 * Uses GSAP ScrollTrigger with scrub:true to tie the chart's draw
 * animation to scroll progress. The line "draws itself" as you scroll
 * through the section.
 *
 * Performance: Pure SVG, no canvas/WebGL. GPU-accelerated via stroke-dashoffset.
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface ScrollChartProps {
  className?: string;
  triggerSelector?: string;
}

export function ScrollChart({ className = "", triggerSelector = "#stats-section" }: ScrollChartProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const barsRef = useRef<(SVGRectElement | null)[]>([]);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const path = pathRef.current;
    if (!path) return;

    // Set up stroke animation
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: triggerSelector,
        start: "top 80%",
        end: "bottom 20%",
        scrub: 1.5,
      },
    });

    // Animate line drawing
    tl.to(path, {
      strokeDashoffset: 0,
      duration: 1,
      ease: "none",
    });

    // Animate bars growing
    barsRef.current.forEach((bar, i) => {
      if (!bar) return;
      const targetHeight = bar.getAttribute("data-height") || "0";
      gsap.fromTo(
        bar,
        { attr: { height: 0, y: 120 } },
        {
          attr: { height: targetHeight, y: 120 - Number(targetHeight) },
          scrollTrigger: {
            trigger: triggerSelector,
            start: "top 75%",
            end: "center center",
            scrub: 1,
          },
          delay: i * 0.05,
        }
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, [triggerSelector]);

  // Chart data points
  const linePoints = "M 20,100 C 60,90 80,60 120,55 C 160,50 200,70 240,45 C 280,20 320,35 360,15 C 400,25 440,10 480,5";

  const barData = [
    { x: 40, height: 40 },
    { x: 100, height: 65 },
    { x: 160, height: 50 },
    { x: 220, height: 80 },
    { x: 280, height: 70 },
    { x: 340, height: 95 },
    { x: 400, height: 85 },
    { x: 460, height: 100 },
  ];

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 500 130"
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Background grid */}
        {[0, 30, 60, 90, 120].map((y) => (
          <line
            key={y}
            x1="20"
            y1={y}
            x2="480"
            y2={y}
            stroke="#e2e8f0"
            strokeWidth="0.5"
            strokeDasharray="4 4"
          />
        ))}

        {/* Bars */}
        {barData.map((bar, i) => (
          <rect
            key={i}
            ref={(el) => { barsRef.current[i] = el; }}
            x={bar.x - 12}
            y={120}
            width="24"
            height="0"
            rx="4"
            fill="url(#barGradient)"
            opacity="0.6"
            data-height={bar.height}
          />
        ))}

        {/* Animated line */}
        <path
          ref={pathRef}
          d={linePoints}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {[
          [20, 100], [120, 55], [240, 45], [360, 15], [480, 5],
        ].map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r="4"
            fill="white"
            stroke="#3b82f6"
            strokeWidth="2"
            className="opacity-0"
            style={{ animation: `fadeIn 0.3s ease forwards ${0.5 + i * 0.1}s` }}
          />
        ))}

        {/* Gradients */}
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
