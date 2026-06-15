"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sparkles, Stars } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function GlobeCore() {
  const outerRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (outerRef.current) outerRef.current.rotation.y += delta * 0.25;
    if (innerRef.current) {
      innerRef.current.rotation.y -= delta * 0.4;
      innerRef.current.rotation.x += delta * 0.15;
    }
    if (ringRef.current) ringRef.current.rotation.z += delta * 0.3;
  });

  return (
    <group>
      {/* Outer gold wireframe sphere */}
      <mesh ref={outerRef}>
        <sphereGeometry args={[1.4, 32, 32]} />
        <meshStandardMaterial
          color="#f4c95d"
          transparent
          opacity={0.18}
          emissive="#f4c95d"
          emissiveIntensity={0.6}
          wireframe
        />
      </mesh>
      {/* Inner cyan icosahedron */}
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[1.0, 2]} />
        <meshStandardMaterial
          color="#22d3ee"
          transparent
          opacity={0.28}
          emissive="#22d3ee"
          emissiveIntensity={0.5}
          wireframe
        />
      </mesh>
      {/* Equatorial ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.6, 0.02, 8, 80]} />
        <meshStandardMaterial
          color="#f4c95d"
          emissive="#f4c95d"
          emissiveIntensity={1.2}
          transparent
          opacity={0.6}
        />
      </mesh>
      {/* Gold particles */}
      <Sparkles
        count={80}
        scale={3.5}
        size={1.5}
        speed={0.3}
        color="#f4c95d"
        opacity={0.7}
      />
    </group>
  );
}

export function PortfolioGlobe() {
  return (
    <div
      className="glass-panel relative overflow-hidden rounded-xl"
      style={{ height: 320 }}
    >
      <Canvas camera={{ position: [0, 0, 4.0], fov: 42 }}>
        <color attach="background" args={["#080f1f"]} />
        <ambientLight intensity={0.4} />
        <pointLight position={[3, 3, 3]} intensity={1.5} color="#f4c95d" />
        <pointLight position={[-3, -2, 2]} intensity={0.8} color="#22d3ee" />
        <Stars radius={90} depth={50} count={800} factor={2.5} fade speed={0.4} />
        <GlobeCore />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0f172a] to-transparent p-4">
        <p className="text-center text-xs uppercase tracking-[0.3em] text-slate-500">
          Portfolio Intelligence Globe
        </p>
      </div>
    </div>
  );
}
