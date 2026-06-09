"use client";

/*
  ═══════════════════════════════════════════════════════════════════
  CountryCarCanvas — small auto-rotating 3D car for country cards
  Model: /public/car.glb (shared placeholder for all countries)
  Same gold (#c9a84c) + dark blue (#0a0a2e) lighting palette as the
  showroom hero canvas, transparent background so the card shows through.
  ═══════════════════════════════════════════════════════════════════
*/

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

useGLTF.preload("/car.glb");

const MAT_BODY = new THREE.MeshStandardMaterial({
  color: new THREE.Color("#1a1a1a"),
  metalness: 1.0,
  roughness: 0.1,
  envMapIntensity: 1.5,
});

const MAT_GOLD = new THREE.MeshStandardMaterial({
  color: new THREE.Color("#c9a84c"),
  metalness: 0.9,
  roughness: 0.2,
  envMapIntensity: 1.5,
});

const MAT_GLASS = new THREE.MeshStandardMaterial({
  color: new THREE.Color("#0a0f1a"),
  metalness: 0.9,
  roughness: 0.0,
  transparent: true,
  opacity: 0.3,
  side: THREE.DoubleSide,
});

function resolveMaterial(matName) {
  if (!matName) return MAT_BODY;
  const n = matName.toLowerCase();
  if (n.includes("window")) return MAT_GLASS;
  if (
    n.includes("badge") ||
    n.includes("grille") ||
    n.includes("brass") ||
    n.includes("details") ||
    n.includes("wheel") ||
    n.includes("rim")
  ) return MAT_GOLD;
  return MAT_BODY;
}

// TODO: swap per-country model — all four cards currently load /public/car.glb
function SpinningCar() {
  const groupRef = useRef();
  const { scene } = useGLTF("/car.glb");
  const materialsApplied = useRef(false);

  useFrame((_, delta) => {
    if (!materialsApplied.current) {
      scene.traverse((obj) => {
        if (!obj.isMesh) return;
        const matName = Array.isArray(obj.material)
          ? obj.material[0]?.name
          : obj.material?.name;
        obj.material = resolveMaterial(matName);
      });
      materialsApplied.current = true;
    }

    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.4;
    }
  });

  return (
    <group ref={groupRef} scale={1.4} position={[0, -0.3, 0]}>
      <primitive object={scene} />
    </group>
  );
}

function Lights() {
  return (
    <>
      <ambientLight color="#c9a84c" intensity={0.4} />
      <directionalLight position={[3, 3, 2]} intensity={1.8} color="#0a0a2e" />
      <directionalLight position={[-2, 2, -3]} intensity={1.5} color="#c9a84c" />
    </>
  );
}

export default function CountryCarCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0.6, 3.2], fov: 35 }}
      gl={{
        alpha: true,
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
      }}
      style={{ background: "transparent", width: "100%", height: "100%" }}
    >
      <Suspense fallback={null}>
        <Lights />
        <SpinningCar />
      </Suspense>
    </Canvas>
  );
}
