"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sparkles, Sphere, Stars } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";

type GlobeVisual = "normal" | "flash" | "warning";

function resolveVisual(flashMode: boolean, warningMode: boolean): GlobeVisual {
  if (flashMode) return "flash";
  if (warningMode) return "warning";
  return "normal";
}

const GLOBE_COLORS: Record<
  GlobeVisual,
  { core: string; wire: string; sparkles: string; glow: number; sparkleSpeed: number }
> = {
  normal: {
    core: "#00f9ff",
    wire: "#00f9ff",
    sparkles: "#00f9ff",
    glow: 1.0,
    sparkleSpeed: 0.4,
  },
  flash: {
    core: "#ff2d55",
    wire: "#ff00aa",
    sparkles: "#ff2d55",
    glow: 2.8,
    sparkleSpeed: 1.4,
  },
  warning: {
    core: "#fbbf24",
    wire: "#f59e0b",
    sparkles: "#facc15",
    glow: 1.8,
    sparkleSpeed: 0.4,
  },
};

function ShieldCore({ visual }: { visual: GlobeVisual }) {
  const groupRef = useRef<THREE.Group>(null);
  const wireRef = useRef<THREE.Mesh>(null);
  const colors = GLOBE_COLORS[visual];

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.35;
    if (wireRef.current) wireRef.current.rotation.x += delta * 0.2;
  });

  return (
    <group ref={groupRef}>
      <Sphere args={[1.2, 48, 48]}>
        <meshStandardMaterial
          color={colors.core}
          transparent
          opacity={0.12}
          emissive={colors.core}
          emissiveIntensity={colors.glow}
          wireframe
        />
      </Sphere>
      <mesh ref={wireRef}>
        <icosahedronGeometry args={[1.45, 2]} />
        <meshStandardMaterial
          color={colors.wire}
          transparent
          opacity={0.35}
          wireframe
        />
      </mesh>
      <Sparkles
        count={120}
        scale={3.2}
        size={2}
        speed={colors.sparkleSpeed}
        color={colors.sparkles}
      />
    </group>
  );
}

interface ShieldGlobeProps {
  alertMode: boolean;
  flashMode?: boolean;
  warningMode?: boolean;
  alertMessage?: string | null;
}

export function ShieldGlobe({
  alertMode,
  flashMode = false,
  warningMode = false,
  alertMessage,
}: ShieldGlobeProps) {
  const visual = resolveVisual(flashMode, warningMode);

  return (
    <div
      className={cn(
        "glass-panel relative h-[360px] overflow-hidden rounded-xl",
        visual === "flash" && "alert-flash border-[#ff2d55]",
        visual === "warning" && "alert-warning-pulse",
      )}
    >
      <Canvas camera={{ position: [0, 0, 4.2], fov: 45 }}>
        <color attach="background" args={["#05050a"]} />
        <ambientLight intensity={0.35} />
        <pointLight
          position={[4, 4, 4]}
          intensity={1.2}
          color={GLOBE_COLORS[visual].core}
        />
        <Stars radius={80} depth={40} count={1200} factor={3} fade speed={0.6} />
        <ShieldCore visual={visual} />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.4} />
      </Canvas>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0a0a0f] to-transparent p-4 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
          Force-Field Shield Globe
        </p>
        {alertMode && alertMessage && (
          <p
            className={cn(
              "mt-1 text-sm font-bold",
              visual === "flash" && "text-[#ff2d55]",
              visual === "warning" && "text-[#fbbf24]",
            )}
          >
            {alertMessage}
          </p>
        )}
      </div>
    </div>
  );
}
