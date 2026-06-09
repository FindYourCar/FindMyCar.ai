"use client";

import { useRef, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  useGLTF,
  Environment,
  MeshReflectorMaterial,
  SpotLight,
} from "@react-three/drei";
import * as THREE from "three";

/* ─────────────────────────────────────────────────────────────────────────────
   Model path — swap "/car.glb" for any other model under /public/
   ─────────────────────────────────────────────────────────────────────────────*/
const CAR_MODEL_PATH = "/car.glb";
useGLTF.preload(CAR_MODEL_PATH);

/* ─────────────────────────────────────────────────────────────────────────────
   CarModel
   Slow, smooth Y-axis auto-rotation. No scroll dependency, no DOM effects.
   ─────────────────────────────────────────────────────────────────────────────*/
function CarModel() {
  const groupRef = useRef();
  const { scene } = useGLTF(CAR_MODEL_PATH);

  // Gentle float bob
  const clock = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    clock.current += delta;
    // Turntable: full rotation every ~18 seconds
    groupRef.current.rotation.y += delta * (Math.PI * 2) / 18;
    // Subtle breathing float — ±0.04 units
    groupRef.current.position.y = -0.38 + Math.sin(clock.current * 0.5) * 0.04;
  });

  return (
    <group ref={groupRef} scale={[1.18, 1.18, 1.18]} position={[0, -0.38, 0]}>
      <primitive object={scene} />
    </group>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ShowroomFloor
   Polished dark mirror plane using MeshReflectorMaterial.
   Reflects the car like a luxury dealership floor.
   ─────────────────────────────────────────────────────────────────────────────*/
function ShowroomFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.72, 0]} receiveShadow>
      <planeGeometry args={[50, 50]} />
      <MeshReflectorMaterial
        blur={[400, 100]}
        resolution={1024}
        mixBlur={1}
        mixStrength={60}
        roughness={1}
        depthScale={1.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#050505"
        metalness={0.9}
        mirror={0.75}
      />
    </mesh>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CinematicLights
   ── Key light   : strong white from front-left  → illuminates body lines
   ── Fill light  : soft blue from right          → depth + cool shadow
   ── Rim light   : orange/red from rear          → cinematic separation glow
   ── Under light : dim white from below          → undercarriage definition
   ── Ambient     : very low so blacks stay black
   ─────────────────────────────────────────────────────────────────────────────*/
function CinematicLights() {
  return (
    <>
      {/* Ambient — barely there so the scene stays dark and dramatic */}
      <ambientLight intensity={0.08} color="#ffffff" />

      {/* KEY LIGHT — front-left, sharp white, defines paint and body lines */}
      <SpotLight
        position={[-5, 7, 6]}
        angle={0.35}
        penumbra={0.4}
        intensity={180}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
        distance={22}
        attenuation={6}
        anglePower={4}
      />

      {/* Secondary key fill — soften harsh key shadows on body panels */}
      <directionalLight
        position={[-3, 5, 5]}
        intensity={1.6}
        color="#f8f8ff"
        castShadow={false}
      />

      {/* FILL LIGHT — right side, cool blue, creates depth and cool shadow */}
      <SpotLight
        position={[6, 4, -2]}
        angle={0.45}
        penumbra={0.7}
        intensity={60}
        color="#3a6bcc"
        distance={20}
        attenuation={8}
        anglePower={3}
      />

      {/* RIM / BACK LIGHT — rear, warm orange-red, cinematic separation */}
      <SpotLight
        position={[1, 3.5, -7]}
        angle={0.5}
        penumbra={0.8}
        intensity={90}
        color="#ff4500"
        distance={18}
        attenuation={5}
        anglePower={3}
      />

      {/* Rim accent — slight purple/magenta from rear-left for extra drama */}
      <pointLight
        position={[-4, 2, -5]}
        intensity={18}
        color="#9b30ff"
        distance={12}
      />

      {/* UNDER LIGHT — low white from below, illuminates undercarriage + floor */}
      <pointLight
        position={[0, -0.5, 0]}
        intensity={12}
        color="#e8f0ff"
        distance={6}
      />

      {/* Top studio softbox — diffused overhead for roof/hood highlights */}
      <rectAreaLight
        position={[0, 8, 1]}
        rotation={[-Math.PI / 2, 0, 0]}
        width={8}
        height={5}
        intensity={3}
        color="#ffffff"
      />
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Scene
   ─────────────────────────────────────────────────────────────────────────────*/
function Scene() {
  return (
    <Suspense fallback={null}>
      <CinematicLights />
      <CarModel />
      <ShowroomFloor />
      {/* Studio HDRI gives paint + glass realistic environment reflections */}
      <Environment preset="studio" />
    </Suspense>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Hero3DCanvas
   Fixed, full-viewport, z-index:-1 so it NEVER touches page layout.
   Pure black background — blends seamlessly into the dark site palette.
   ─────────────────────────────────────────────────────────────────────────────*/
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
        camera={{ position: [0, 1.4, 7.2], fov: 38 }}
        gl={{
          alpha: false,                                     // no transparency — pure black bg
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.35,                       // punchy cinematic exposure
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        shadows="soft"
        style={{ background: "#000000" }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
