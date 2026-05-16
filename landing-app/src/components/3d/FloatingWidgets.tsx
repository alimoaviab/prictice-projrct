/**
 * FloatingWidgets — 3D floating UI elements for the hero background.
 *
 * Renders small 3D shapes (cubes, spheres, rounded boxes) that float
 * and rotate slowly, creating depth behind the hero text. Scroll-linked
 * so they drift as the user scrolls.
 *
 * Performance: Low poly, no textures, instanced where possible.
 * Accessibility: aria-hidden, purely decorative.
 */

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

interface WidgetProps {
  position: [number, number, number];
  color: string;
  speed: number;
  size: number;
  shape: "box" | "sphere" | "octahedron";
}

function Widget({ position, color, speed, size, shape }: WidgetProps) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * speed;
    ref.current.rotation.x = Math.sin(t) * 0.3;
    ref.current.rotation.y = Math.cos(t * 0.7) * 0.4;
    ref.current.position.y = position[1] + Math.sin(t * 0.5) * 0.2;
  });

  const geometry = useMemo(() => {
    switch (shape) {
      case "sphere":
        return <sphereGeometry args={[size, 16, 16]} />;
      case "octahedron":
        return <octahedronGeometry args={[size]} />;
      default:
        return <boxGeometry args={[size, size, size]} />;
    }
  }, [shape, size]);

  return (
    <Float speed={speed} rotationIntensity={0.3} floatIntensity={0.4}>
      <mesh ref={ref} position={position}>
        {geometry}
        <meshPhysicalMaterial
          color={color}
          metalness={0.1}
          roughness={0.3}
          transparent
          opacity={0.7}
          clearcoat={0.5}
        />
      </mesh>
    </Float>
  );
}

const widgets: WidgetProps[] = [
  { position: [-4, 2, -3], color: "#3b82f6", speed: 0.8, size: 0.4, shape: "box" },
  { position: [4.5, -1, -4], color: "#6366f1", speed: 0.6, size: 0.3, shape: "sphere" },
  { position: [-3, -2, -2], color: "#06b6d4", speed: 1.0, size: 0.35, shape: "octahedron" },
  { position: [3, 3, -5], color: "#8b5cf6", speed: 0.5, size: 0.5, shape: "box" },
  { position: [-5, 0, -6], color: "#2563eb", speed: 0.7, size: 0.25, shape: "sphere" },
  { position: [5, 1.5, -3], color: "#0ea5e9", speed: 0.9, size: 0.3, shape: "octahedron" },
  { position: [0, -3, -4], color: "#4f46e5", speed: 0.4, size: 0.4, shape: "box" },
  { position: [-2, 3, -5], color: "#7c3aed", speed: 0.6, size: 0.2, shape: "sphere" },
];

export function FloatingWidgets({ className = "" }: { className?: string }) {
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReduced) return null;

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`} aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true }}
        style={{ position: "absolute", inset: 0 }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.4} />

        {widgets.map((w, i) => (
          <Widget key={i} {...w} />
        ))}
      </Canvas>
    </div>
  );
}
