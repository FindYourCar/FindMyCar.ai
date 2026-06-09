"use client";

/*
  ═══════════════════════════════════════════════════════════════════
  Hero3DCanvas — BMW M5 G90 Cinematic Showroom
  Car model: /public/car.glb  (31 MB, Blender export)
  ═══════════════════════════════════════════════════════════════════
*/

import { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  useGLTF,
  Environment,
  MeshReflectorMaterial,
} from "@react-three/drei";
import * as THREE from "three";

/* ── Preload so the model is ready before first paint ────────────── */
useGLTF.preload("/car.glb");

/* ══════════════════════════════════════════════════════════════════
   CAR
   Loads /public/car.glb, places it on the right half of the scene,
   rotates slowly on Y (turntable).
   ══════════════════════════════════════════════════════════════════ */
function Car() {
  const ref = useRef();
  const { scene } = useGLTF("/car.glb");

  useFrame((_, delta) => {
    if (!ref.current) return;
    // Full rotation every 20 s — unhurried luxury turntable
    ref.current.rotation.y += delta * (Math.PI * 2) / 20;
  });

  return (
    /*
      X = +1.6  → shifts the car to the RIGHT half of the viewport.
      Y = -0.12 → sits the car just above the reflective floor.
      scale 1.2 → large enough to feel imposing; all 4 wheels visible.
    */
    <group ref={ref} position={[1.6, -0.12, 0]} scale={1.2}>
      <primitive object={scene} />
    </group>
  );
}

/* ══════════════════════════════════════════════════════════════════
   FLOOR
   Polished black-marble showroom floor with live car reflection.
   ══════════════════════════════════════════════════════════════════ */
function Floor() {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.72, 0]}
      receiveShadow
    >
      <planeGeometry args={[60, 60]} />
      <MeshReflectorMaterial
        color="#050505"
        metalness={0.9}
        roughness={0.18}
        mirror={0.8}
        mixStrength={80}
        mixBlur={1.2}
        resolution={1024}
        blur={[500, 200]}
        depthScale={1.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
      />
    </mesh>
  );
}

/* ══════════════════════════════════════════════════════════════════
   LIGHTS
   5-point cinematic automotive rig:
     1. Key   — strong white, front-left
     2. Fill  — deep blue,   right side
     3. Rim   — orange/amber, directly behind
     4. Under — soft white,  below pointing up
     5. Ambient — near-zero so blacks stay black
   ══════════════════════════════════════════════════════════════════ */
function Lights() {
  return (
    <>
      {/* 1. KEY — front-left, strong white, casts sharp shadows */}
      <directionalLight
        position={[-4.5, 6, 5]}
        intensity={4.5}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0005}
      />

      {/* Soft secondary front key to fill harsh shadows on hood/roof */}
      <directionalLight
        position={[-2, 4, 6]}
        intensity={1.8}
        color="#f0f4ff"
        castShadow={false}
      />

      {/* 2. FILL — right side, deep blue, creates cool depth on shadow side */}
      <directionalLight
        position={[7, 3, 0]}
        intensity={1.4}
        color="#1a3aff"
        castShadow={false}
      />

      {/* 3. RIM — directly behind, orange/amber, cinematic separation glow */}
      <directionalLight
        position={[1.6, 3.5, -8]}
        intensity={3.5}
        color="#ff7700"
        castShadow={false}
      />

      {/* Rim accent — tight warm halo along rear panels */}
      <pointLight
        position={[1.6, 1.5, -5]}
        intensity={60}
        color="#ff5500"
        distance={8}
        decay={2}
      />

      {/* 4. UNDER — soft white from below, illuminates undercarriage + floor */}
      <pointLight
        position={[1.6, -0.55, 0]}
        intensity={14}
        color="#ddeeff"
        distance={5}
        decay={2}
      />

      {/* 5. AMBIENT — barely visible, keeps absolute blacks from crushing */}
      <ambientLight intensity={0.06} color="#ffffff" />
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SCENE
   ══════════════════════════════════════════════════════════════════ */
function Scene() {
  return (
    <Suspense fallback={null}>
      <Lights />
      <Car />
      <Floor />
      {/* Studio HDRI — realistic reflections on BMW paint + glass */}
      <Environment preset="studio" />
    </Suspense>
  );
}

/* ══════════════════════════════════════════════════════════════════
   HERO 3D CANVAS
   ─ position: fixed, full viewport, z-index: -1
   ─ Never touches page layout. Never intercepts pointer events.
   ─ Pure #000000 background — no gradients, no grey.
   ══════════════════════════════════════════════════════════════════ */
export default function Hero3DCanvas() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: -1,
        pointerEvents: "none",
        background: "#000000",
      }}
    >
      <Canvas
        shadows
        camera={{
          position: [0, 1.2, 7.5], // stepped back so all 4 wheels are in frame
          fov: 40,                  // narrow FOV = premium, less distortion
          near: 0.1,
          far: 100,
        }}
        gl={{
          alpha: false,
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.5,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        style={{ background: "#000000" }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
