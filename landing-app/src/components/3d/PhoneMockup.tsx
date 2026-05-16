/**
 * Draggable 3D Phone Mockup — interactive smartphone that users can rotate.
 *
 * Features:
 * - Click/touch drag to rotate freely
 * - Subtle floating animation when idle (draws attention)
 * - Screen shows a gradient/texture simulating the app
 * - GPU-accelerated, respects reduced-motion
 * - Accessible: aria-hidden (decorative), no semantic content in WebGL
 */

import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox, Environment, Float } from "@react-three/drei";
import { useDrag } from "@use-gesture/react";
import * as THREE from "three";

function Phone() {
  const meshRef = useRef<THREE.Group>(null);
  const [isDragging, setIsDragging] = useState(false);
  const targetRotation = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });

  // Drag gesture
  const bind = useDrag(
    ({ delta: [dx, dy], active }) => {
      setIsDragging(active);
      if (active) {
        velocity.current.x = dy * 0.008;
        velocity.current.y = dx * 0.008;
        targetRotation.current.x += dy * 0.008;
        targetRotation.current.y += dx * 0.008;
      }
    },
    { pointer: { touch: true } }
  );

  // Smooth rotation + idle floating
  useFrame((_, delta) => {
    if (!meshRef.current) return;

    if (!isDragging) {
      // Idle: gentle floating rotation
      const t = Date.now() * 0.001;
      targetRotation.current.x += Math.sin(t * 0.5) * 0.0003;
      targetRotation.current.y += Math.cos(t * 0.3) * 0.0005;

      // Dampen velocity
      velocity.current.x *= 0.95;
      velocity.current.y *= 0.95;
      targetRotation.current.x += velocity.current.x;
      targetRotation.current.y += velocity.current.y;
    }

    // Lerp to target
    meshRef.current.rotation.x = THREE.MathUtils.lerp(
      meshRef.current.rotation.x,
      targetRotation.current.x,
      delta * 5
    );
    meshRef.current.rotation.y = THREE.MathUtils.lerp(
      meshRef.current.rotation.y,
      targetRotation.current.y,
      delta * 5
    );
  });

  return (
    <group ref={meshRef} {...(bind() as any)}>
      {/* Phone body */}
      <RoundedBox args={[2.4, 4.8, 0.25]} radius={0.2} smoothness={4}>
        <meshPhysicalMaterial
          color="#1e293b"
          metalness={0.8}
          roughness={0.15}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </RoundedBox>

      {/* Screen */}
      <RoundedBox args={[2.1, 4.3, 0.01]} radius={0.15} smoothness={4} position={[0, 0, 0.13]}>
        <meshBasicMaterial color="#0f172a" />
      </RoundedBox>

      {/* Screen content (gradient overlay) */}
      <mesh position={[0, 0, 0.14]}>
        <planeGeometry args={[2.0, 4.2]} />
        <meshBasicMaterial>
          <canvasTexture
            attach="map"
            image={createScreenTexture()}
          />
        </meshBasicMaterial>
      </mesh>

      {/* Camera notch */}
      <mesh position={[0, 2.1, 0.14]}>
        <cylinderGeometry args={[0.08, 0.08, 0.02, 16]} />
        <meshBasicMaterial color="#0f172a" />
      </mesh>
    </group>
  );
}

// Create a simple gradient texture for the phone screen
function createScreenTexture(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, "#1e40af");
  grad.addColorStop(0.5, "#3b82f6");
  grad.addColorStop(1, "#1e293b");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 512);

  // Fake UI elements
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillRect(20, 60, 216, 40);
  ctx.fillRect(20, 120, 100, 80);
  ctx.fillRect(136, 120, 100, 80);
  ctx.fillRect(20, 220, 216, 30);
  ctx.fillRect(20, 270, 216, 30);
  ctx.fillRect(20, 320, 150, 30);

  // Status bar dots
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.beginPath();
  ctx.arc(128, 30, 4, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
}

export function PhoneMockup3D({ className = "" }: { className?: string }) {
  // Check reduced motion
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReduced) {
    // Fallback: static phone image placeholder
    return (
      <div className={`${className} flex items-center justify-center`}>
        <div className="w-48 h-96 bg-gradient-to-b from-slate-800 to-slate-900 rounded-[2rem] border-4 border-slate-700 shadow-2xl" />
      </div>
    );
  }

  return (
    <div className={`${className} cursor-grab active:cursor-grabbing`} aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        style={{ touchAction: "none" }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight position={[-3, -3, 2]} intensity={0.3} color="#60a5fa" />

        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5} floatingRange={[-0.1, 0.1]}>
          <Phone />
        </Float>

        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
