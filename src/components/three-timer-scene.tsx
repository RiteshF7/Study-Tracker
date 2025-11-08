"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas as FiberCanvas, useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

const BaseRing = () => {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const t = clock.getElapsedTime();
    ringRef.current.rotation.x = Math.PI / 2;
    ringRef.current.rotation.z = t * 0.2;
  });

  return (
    <mesh ref={ringRef}>
      <ringGeometry args={[1.08, 1.22, 96, 16]} />
      <meshStandardMaterial
        color="#1e293b"
        metalness={0.25}
        roughness={0.75}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

const CoreSphere = ({ isFinished }: { isFinished: boolean }) => {
  const sphereRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!sphereRef.current) return;
    const t = clock.getElapsedTime();
    const scale = 1 + Math.sin(t * 2) * 0.05;
    sphereRef.current.scale.setScalar(scale);
  });

  return (
    <mesh ref={sphereRef}>
      <sphereGeometry args={[0.55, 64, 64]} />
      <meshStandardMaterial
        color={isFinished ? "#ef4444" : "#38bdf8"}
        emissive={isFinished ? "#b91c1c" : "#0ea5e9"}
        emissiveIntensity={0.9}
        metalness={0.35}
        roughness={0.25}
        transparent
        opacity={0.95}
      />
    </mesh>
  );
};

const ProgressRing = ({ progress, isFinished }: { progress: number; isFinished: boolean }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const clamped = clamp01(progress);

  const geometry = useMemo(() => {
    if (clamped <= 0) return null;
    const thetaLength = Math.max(clamped, 0.01) * Math.PI * 2;
    return new THREE.RingGeometry(0.9, 1.05, 256, 24, -Math.PI / 2, thetaLength);
  }, [clamped]);

  useEffect(() => {
    return () => {
      geometry?.dispose();
    };
  }, [geometry]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    meshRef.current.rotation.x = Math.PI / 2 + Math.sin(t) * 0.08;
    meshRef.current.rotation.y = Math.cos(t) * 0.12;
  });

  if (!geometry) {
    return null;
  }

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        color={isFinished ? "#ef4444" : "#22c55e"}
        emissive={isFinished ? "#991b1b" : "#166534"}
        emissiveIntensity={1.4}
        metalness={0.5}
        roughness={0.3}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

const ThreeTimerScene = ({ progress, isFinished }: { progress: number; isFinished: boolean }) => (
  <>
    <color attach="background" args={["#020617"]} />
    <ambientLight intensity={0.6} />
    <directionalLight position={[4, 6, 5]} intensity={1.1} />
    <pointLight position={[-3, -2, -4]} intensity={0.35} color="#22d3ee" />
    <BaseRing />
    <CoreSphere isFinished={isFinished} />
    <ProgressRing progress={progress} isFinished={isFinished} />
    <Sparkles
      count={isFinished ? 90 : 45}
      scale={2.6}
      size={isFinished ? 7 : 4}
      speed={isFinished ? 0.6 : 0.25}
      color={isFinished ? "#f87171" : "#38bdf8"}
    />
  </>
);

export function ThreeTimerCanvas({ progress, isFinished }: { progress: number; isFinished: boolean }) {
  return (
    <div className="absolute inset-0">
      <FiberCanvas dpr={[1, 1.5]} camera={{ position: [0, 0, 3], fov: 45 }}>
        <Suspense fallback={null}>
          <ThreeTimerScene progress={progress} isFinished={isFinished} />
        </Suspense>
      </FiberCanvas>
    </div>
  );
}

