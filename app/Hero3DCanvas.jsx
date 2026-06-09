"use client";

import { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ScrollControls, useScroll, useGLTF, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

/*
  ─────────────────────────────────────────────────────────────────────────────
  Car model path — your BMW M5 G90 GLB lives at /public/car.glb
  To swap models: replace "/car.glb" with the new path under /public/
  ─────────────────────────────────────────────────────────────────────────────
*/
const CAR_MODEL_PATH = "/car.glb";

// Preload so there's no pop-in on first render
useGLTF.preload(CAR_MODEL_PATH);

/* ─── Helpers ───────────────────────────────────────────────────────────────── */

/** Walk the scene graph and collect objects whose names match a keyword list */
function findByKeywords(scene, keywords) {
  const results = [];
  scene.traverse((obj) => {
    const n = obj.name.toLowerCase();
    if (keywords.some((kw) => n.includes(kw))) results.push(obj);
  });
  return results;
}

/** Smooth lerp applied every frame */
const lerpV3 = (vec, target, alpha) => vec.lerp(target, alpha);

/* ─────────────────────────────────────────────────────────────────────────────
   BMW M5 Explode Groups
   We map real node-name keywords → explode direction vectors.
   The model has: WHEEL_LF/RF/LR/RR, RIM_LF/RF/LR, roof carbon,
   mirrors carbon, GrilleNoAlpha, Body_lodA (multiple panels).
   ─────────────────────────────────────────────────────────────────────────── */
const EXPLODE_GROUPS = [
  { keywords: ["wheel_lf", "rim_lf", "g_tyre_lf", "g_wheel_hub_lf"], dir: new THREE.Vector3(-1.6,  0.4,  1.4) },
  { keywords: ["wheel_rf", "rim_rf", "g_tyre_rf", "g_wheel_hub_rf"], dir: new THREE.Vector3( 1.6,  0.4,  1.4) },
  { keywords: ["wheel_lr", "rim_lr", "g_tyre_lr", "g_wheel_hub_lr"], dir: new THREE.Vector3(-1.6,  0.4, -1.4) },
  { keywords: ["wheel_rr", "rim_rr", "g_tyre_rr", "g_wheel_hub_rr"], dir: new THREE.Vector3( 1.6,  0.4, -1.4) },
  { keywords: ["roof carbon"],                                         dir: new THREE.Vector3( 0,    2.2,  0  ) },
  { keywords: ["mirrors carbon", "mirrors stock"],                     dir: new THREE.Vector3( 0,    0.8,  0  ) },
  { keywords: ["grillenoalpha"],                                       dir: new THREE.Vector3( 0,    0.3,  2.2) },
  { keywords: ["body_loda.005", "body_loda.006"],                      dir: new THREE.Vector3( 0,   -0.5,  0  ) },
  { keywords: ["body_loda.008", "body_loda.009"],                      dir: new THREE.Vector3( 0,    0.6,  0  ) },
  { keywords: ["body_loda.010", "body_loda.012"],                      dir: new THREE.Vector3( 0,    0,   -1.8) },
  { keywords: ["paint_geo"],                                           dir: new THREE.Vector3( 0,    0.2,  0  ) },
  { keywords: ["engine_geo"],                                          dir: new THREE.Vector3( 0,   -1.0,  1.5) },
  { keywords: ["carbon1_geo"],                                         dir: new THREE.Vector3( 0,    0.4, -0.5) },
  { keywords: ["badge_geo"],                                           dir: new THREE.Vector3( 0,    0,    2.4) },
];

/* ─────────────────────────────────────────────────────────────────────────────
   CarModel — loads the GLB, stores original positions, drives explode on scroll
   ─────────────────────────────────────────────────────────────────────────────*/
function CarModel() {
  const groupRef = useRef();
  const scroll    = useScroll();
  const { scene } = useGLTF(CAR_MODEL_PATH);

  // Build part-group refs once on first render (lazy init pattern)
  const partsRef = useRef(null);

  function buildParts() {
    if (partsRef.current) return;
    partsRef.current = EXPLODE_GROUPS.map(({ keywords, dir }) => {
      const objects = findByKeywords(scene, keywords);
      // Store each object's original world position offset
      const origins = objects.map((o) => o.position.clone());
      return { objects, origins, dir };
    });
  }

  useFrame(() => {
    if (!groupRef.current) return;
    buildParts();

    const s = scroll.offset; // 0 → 1

    // ── Whole-car rotation ──────────────────────────────────────────────────
    groupRef.current.rotation.y = s * Math.PI * 1.8;
    groupRef.current.position.y = Math.sin(s * Math.PI * 3) * 0.06 - 0.3;

    // ── Explode phase ───────────────────────────────────────────────────────
    // 0–0.35  : explode out (cubic ease-in)
    // 0.35–0.65: snap back (cubic ease-out)
    // 0.65–1  : assembled, keep rotating
    let explode;
    if (s < 0.35) {
      const t = s / 0.35;
      explode = t * t * t;              // ease-in
    } else if (s < 0.65) {
      const t = (s - 0.35) / 0.30;
      explode = 1 - t * t * t;         // ease-out snap back
    } else {
      explode = 0;
    }

    if (!partsRef.current) return;
    partsRef.current.forEach(({ objects, origins, dir }) => {
      objects.forEach((obj, i) => {
        const origin = origins[i];
        const tx = origin.x + dir.x * explode;
        const ty = origin.y + dir.y * explode;
        const tz = origin.z + dir.z * explode;
        // Smooth lerp so it never snaps instantly
        obj.position.x += (tx - obj.position.x) * 0.12;
        obj.position.y += (ty - obj.position.y) * 0.12;
        obj.position.z += (tz - obj.position.z) * 0.12;
      });
    });
  });

  return (
    <group ref={groupRef} scale={[1.05, 1.05, 1.05]}>
      <primitive object={scene} />
    </group>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Scene — wraps ScrollControls so scroll.offset maps to page scroll
   pages = how many viewport-heights the animation spans (more = slower)
   ─────────────────────────────────────────────────────────────────────────────*/
function Scene() {
  return (
    <ScrollControls pages={5} damping={0.3}>
      <Suspense fallback={null}>
        <CarModel />
      </Suspense>

      {/* Premium neutral lighting — no colour cast on the site palette */}
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 10, 6]}  intensity={1.4} castShadow />
      <directionalLight position={[-6, 4, -6]} intensity={0.5} color="#ddeeff" />
      <pointLight       position={[0, 5, 0]}   intensity={0.7} color="#fff8ee" />

      {/* Subtle ground reflection */}
      <ContactShadows
        position={[0, -0.9, 0]}
        opacity={0.35}
        scale={12}
        blur={2.5}
        far={4}
      />
      <Environment preset="city" />
    </ScrollControls>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Hero3DCanvas
   Fixed, behind all page content (z-index 0), transparent background,
   pointer-events disabled so it never blocks clicks or native scroll.
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
      }}
    >
      <Canvas
        camera={{ position: [0, 1.2, 5.5], fov: 42 }}
        gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
        style={{ background: "transparent" }}
        shadows
      >
        <Scene />
      </Canvas>
    </div>
  );
}
