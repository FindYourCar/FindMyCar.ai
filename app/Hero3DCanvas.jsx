"use client";

import { useRef, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ScrollControls, useScroll, Environment } from "@react-three/drei";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────────────────────────────────────────────────────────
   CarModel
   ─ Placeholder geometry that mimics a car silhouette (body + 4 wheels).
   ─ Replace the geometry inside each mesh with your actual .glb loader when ready.
   ─────────────────────────────────────────────────────────────────────────────
   HOW TO SWAP IN YOUR OWN MODEL:
     1. Place your car.glb in /public/models/car.glb
     2. Add this import at the top:
          import { useGLTF } from "@react-three/drei";
     3. Replace this entire component body with:
          const { scene } = useGLTF("/models/car.glb");
          return <primitive object={scene} ref={groupRef} />;
   ───────────────────────────────────────────────────────────────────────────── */
function CarModel() {
  const groupRef = useRef();
  const scroll = useScroll();

  // Part refs for assembly/disassembly effect
  const bodyRef = useRef();
  const wheelFLRef = useRef();
  const wheelFRRef = useRef();
  const wheelRLRef = useRef();
  const wheelRRRef = useRef();
  const roofRef = useRef();
  const hoodRef = useRef();

  // Shared material — neutral metallic, won't affect site colours
  const bodyMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.18, 0.18, 0.22),
    metalness: 0.85,
    roughness: 0.2,
  });
  const wheelMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.08, 0.08, 0.08),
    metalness: 0.6,
    roughness: 0.5,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0.4, 0.5, 0.6),
    metalness: 0.1,
    roughness: 0.05,
    transparent: true,
    opacity: 0.45,
  });

  useFrame(() => {
    if (!groupRef.current) return;

    const s = scroll.offset; // 0 → 1 as user scrolls

    // ── Main rotation ──────────────────────────────────────────────────────
    groupRef.current.rotation.y = s * Math.PI * 2;

    // ── Assembly effect ────────────────────────────────────────────────────
    // Phase 1  (scroll 0→0.3) : parts explode outward
    // Phase 2  (scroll 0.3→0.6): parts snap back together
    // Phase 3  (scroll 0.6→1) : assembled car continues rotating

    const explode = s < 0.3 ? s / 0.3 : s < 0.6 ? 1 - (s - 0.3) / 0.3 : 0;
    const ease = 1 - Math.pow(1 - explode, 3); // cubic ease

    if (roofRef.current)    roofRef.current.position.y    =  ease * 1.4;
    if (hoodRef.current)    hoodRef.current.position.z    = -ease * 1.2;
    if (wheelFLRef.current) {
      wheelFLRef.current.position.x = -1.05 - ease * 0.8;
      wheelFLRef.current.position.z =  1.1  + ease * 0.8;
    }
    if (wheelFRRef.current) {
      wheelFRRef.current.position.x =  1.05 + ease * 0.8;
      wheelFRRef.current.position.z =  1.1  + ease * 0.8;
    }
    if (wheelRLRef.current) {
      wheelRLRef.current.position.x = -1.05 - ease * 0.8;
      wheelRLRef.current.position.z = -1.1  - ease * 0.8;
    }
    if (wheelRRRef.current) {
      wheelRRRef.current.position.x =  1.05 + ease * 0.8;
      wheelRRRef.current.position.z = -1.1  - ease * 0.8;
    }

    // Slight vertical float
    groupRef.current.position.y = Math.sin(s * Math.PI * 4) * 0.05;
  });

  return (
    <group ref={groupRef} scale={[1, 1, 1]}>
      {/* ── Car body ── */}
      <group ref={bodyRef}>
        {/* Lower body */}
        <mesh material={bodyMat} position={[0, 0, 0]} castShadow>
          <boxGeometry args={[2.0, 0.45, 4.2]} />
        </mesh>
        {/* Skirt / sill */}
        <mesh material={bodyMat} position={[0, -0.28, 0]}>
          <boxGeometry args={[2.1, 0.1, 4.0]} />
        </mesh>
      </group>

      {/* ── Roof / cabin (separates upward) ── */}
      <group ref={roofRef}>
        <mesh material={bodyMat} position={[0, 0.52, 0.1]} castShadow>
          <boxGeometry args={[1.75, 0.38, 2.4]} />
        </mesh>
        {/* Windscreen */}
        <mesh material={glassMat} position={[0, 0.44, 1.25]} rotation={[-0.42, 0, 0]}>
          <planeGeometry args={[1.62, 0.7]} />
        </mesh>
        {/* Rear glass */}
        <mesh material={glassMat} position={[0, 0.44, -1.1]} rotation={[0.42, 0, 0]}>
          <planeGeometry args={[1.62, 0.7]} />
        </mesh>
      </group>

      {/* ── Hood (separates forward) ── */}
      <group ref={hoodRef}>
        <mesh material={bodyMat} position={[0, 0.28, 1.5]} castShadow>
          <boxGeometry args={[1.9, 0.08, 1.2]} />
        </mesh>
      </group>

      {/* ── Wheels ── */}
      <group ref={wheelFLRef} position={[-1.05, -0.28, 1.1]}>
        <mesh material={wheelMat} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.32, 0.32, 0.22, 28]} />
        </mesh>
        {/* Rim */}
        <mesh
          material={new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.9, roughness: 0.1 })}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.18, 0.18, 0.24, 10]} />
        </mesh>
      </group>

      <group ref={wheelFRRef} position={[1.05, -0.28, 1.1]}>
        <mesh material={wheelMat} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.32, 0.32, 0.22, 28]} />
        </mesh>
        <mesh
          material={new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.9, roughness: 0.1 })}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.18, 0.18, 0.24, 10]} />
        </mesh>
      </group>

      <group ref={wheelRLRef} position={[-1.05, -0.28, -1.1]}>
        <mesh material={wheelMat} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.32, 0.32, 0.22, 28]} />
        </mesh>
        <mesh
          material={new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.9, roughness: 0.1 })}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.18, 0.18, 0.24, 10]} />
        </mesh>
      </group>

      <group ref={wheelRRRef} position={[1.05, -0.28, -1.1]}>
        <mesh material={wheelMat} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.32, 0.32, 0.22, 28]} />
        </mesh>
        <mesh
          material={new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.9, roughness: 0.1 })}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.18, 0.18, 0.24, 10]} />
        </mesh>
      </group>
    </group>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Scene — wraps ScrollControls around the car model
   pages controls how many "scroll heights" the animation spans.
   Increase pages to slow the animation down.
   ───────────────────────────────────────────────────────────────────────────── */
function Scene() {
  return (
    <ScrollControls pages={4} damping={0.25}>
      <Suspense fallback={null}>
        <CarModel />
      </Suspense>
      {/* Premium neutral lighting — does NOT introduce new colours */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
      <directionalLight position={[-5, 2, -5]} intensity={0.4} color="#ffffff" />
      <pointLight position={[0, 4, 0]} intensity={0.6} color="#e8eeff" />
      {/* Subtle ground reflection */}
      <Environment preset="city" />
    </ScrollControls>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Hero3DCanvas
   ─ Fixed behind all page content via z-index: -1 / pointer-events: none.
   ─ Transparent background so your site colours show through untouched.
   ───────────────────────────────────────────────────────────────────────────── */
export default function Hero3DCanvas() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,           // above transparent body, below UI (UI elements use z-index 10+)
        pointerEvents: "none", // never intercepts clicks/scrolls
      }}
    >
      <Canvas
        camera={{ position: [0, 1.5, 5.5], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent" }}
        shadows
      >
        <Scene />
      </Canvas>
    </div>
  );
}
