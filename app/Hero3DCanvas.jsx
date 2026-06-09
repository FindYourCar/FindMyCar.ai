"use client";

/*
  ═══════════════════════════════════════════════════════════════════
  Hero3DCanvas — BMW M5 G90  ·  Cinematic Showroom
  Model: /public/car.glb  (31 MB)
  ═══════════════════════════════════════════════════════════════════
*/

import { useRef, useEffect, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, MeshReflectorMaterial } from "@react-three/drei";
import * as THREE from "three";

useGLTF.preload("/car.glb");

/* ── Shared material instances (created once, never recreated) ─────── */
const MAT_BODY = new THREE.MeshStandardMaterial({
  color:     new THREE.Color("#1a1a1a"),
  metalness: 1.0,
  roughness: 0.08,
  envMapIntensity: 2.5,
});

const MAT_GOLD = new THREE.MeshStandardMaterial({
  color:     new THREE.Color("#c9a84c"),
  metalness: 0.95,
  roughness: 0.15,
  envMapIntensity: 2.0,
});

const MAT_GLASS = new THREE.MeshStandardMaterial({
  color:       new THREE.Color("#0a0f1a"),
  metalness:   0.9,
  roughness:   0.0,
  transparent: true,
  opacity:     0.3,
  envMapIntensity: 3.0,
  side: THREE.DoubleSide,
});

const MAT_CARBON = new THREE.MeshStandardMaterial({
  color:     new THREE.Color("#111111"),
  metalness: 0.4,
  roughness: 0.6,
});

const MAT_INTERIOR = new THREE.MeshStandardMaterial({
  color:     new THREE.Color("#1c1410"),
  metalness: 0.1,
  roughness: 0.85,
});

const MAT_LIGHT = new THREE.MeshStandardMaterial({
  color:           new THREE.Color("#ffffff"),
  emissive:        new THREE.Color("#ffe8b0"),
  emissiveIntensity: 1.2,
  metalness:       0.2,
  roughness:       0.1,
  transparent:     true,
  opacity:         0.85,
});

const MAT_BRAKE = new THREE.MeshStandardMaterial({
  color:     new THREE.Color("#333333"),
  metalness: 0.8,
  roughness: 0.4,
});

const MAT_CALIPER = new THREE.MeshStandardMaterial({
  color:     new THREE.Color("#1a1aff"),   // M blue calipers
  metalness: 0.7,
  roughness: 0.3,
});

/* ─────────────────────────────────────────────────────────────────────
   Material routing — keyed on the exact material names from the GLB.
   Returns the shared material instance for each slot.
   ─────────────────────────────────────────────────────────────────────*/
function resolveMaterial(matName) {
  if (!matName) return MAT_BODY;
  const n = matName.toLowerCase();

  // Windows / glass
  if (n.includes("window") || n === "window") return MAT_GLASS;

  // Main paint body
  if (
    n.includes("paint_material") ||
    n.includes("paint___gray") ||
    n.includes("coloured_material") ||
    n.includes("base_material") ||
    n.includes("metalicpaint") ||
    n.includes("paint_matteblack") ||
    n.includes("paint_orange")
  ) return MAT_BODY;

  // Gold trim — badges, grilles, details, brass
  if (
    n.includes("badge") ||
    n.includes("grille") ||
    n.includes("brass") ||
    n.includes("details") ||
    n.includes("csr2_grille") ||
    n.includes("bmw_badge") ||
    n.includes("material_25") ||
    n.includes("material_28") ||
    n.includes("0.003") ||
    n.includes("0.005")
  ) return MAT_GOLD;

  // Carbon fibre
  if (n.includes("carbon") || n.includes("rotor_edge")) return MAT_CARBON;

  // Interior
  if (
    n.includes("interior") ||
    n.includes("int_misc") ||
    n.includes("st_int") ||
    n.includes("material.001") ||
    n.includes("material.003") ||
    n.includes("material.004") ||
    n.includes("material_9") ||
    n.includes("hud_f_w")
  ) return MAT_INTERIOR;

  // Lights / emissive
  if (n.includes("lightemissive") || n.includes("light_material")) return MAT_LIGHT;
  if (n.includes("lighta")) return MAT_LIGHT;

  // Brakes / rotors
  if (n.includes("brake") || n.includes("rotor") || n.includes("screw")) return MAT_BRAKE;

  // Calipers — blue M calipers
  if (n.includes("calliper") || n.includes("caliper")) return MAT_CALIPER;

  // Rim wheels — gold
  if (n.includes("wheel") || n.includes("rim") || n.includes("tyre") || n.includes("tire"))
    return MAT_GOLD;

  // Plastics → body colour
  if (n.includes("plastic") || n.includes("steel")) return MAT_BODY;

  // Fallback → body colour
  return MAT_BODY;
}

/* ─────────────────────────────────────────────────────────────────────
   applyMaterials — walks every mesh in the scene, replaces material
   ─────────────────────────────────────────────────────────────────────*/
function applyMaterials(scene) {
  scene.traverse((obj) => {
    if (!obj.isMesh) return;

    // Grab original material name
    const matName = Array.isArray(obj.material)
      ? obj.material[0]?.name
      : obj.material?.name;

    const newMat = resolveMaterial(matName);
    obj.material = newMat;
    obj.castShadow    = true;
    obj.receiveShadow = true;
  });
}

/* ═══════════════════════════════════════════════════════════════════
   PARTICLES — 200 gold embers floating upward like rising sparks
   ═══════════════════════════════════════════════════════════════════ */
function Particles() {
  const COUNT = 200;
  const pointsRef = useRef();

  // Build initial positions, velocities, and phases
  const { positions, velocities, phases } = useMemo(() => {
    const positions  = new Float32Array(COUNT * 3);
    const velocities = new Float32Array(COUNT);   // Y drift speed
    const phases     = new Float32Array(COUNT);   // sin phase offset

    for (let i = 0; i < COUNT; i++) {
      const angle  = Math.random() * Math.PI * 2;
      const radius = 1.0 + Math.random() * 2.2;
      positions[i * 3 + 0] = 1.6 + Math.cos(angle) * radius;          // x — centred on car
      positions[i * 3 + 1] = -0.7 + Math.random() * 3.0;              // y — spread vertically
      positions[i * 3 + 2] = Math.sin(angle) * radius * 0.6;          // z — oval footprint
      velocities[i] = 0.15 + Math.random() * 0.35;                    // rise speed
      phases[i]     = Math.random() * Math.PI * 2;                    // wobble phase
    }
    return { positions, velocities, phases };
  }, []);

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);

  const mat = useMemo(() => new THREE.PointsMaterial({
    color:       new THREE.Color("#c9a84c"),
    size:        0.025,
    sizeAttenuation: true,
    transparent: true,
    opacity:     0.72,
    depthWrite:  false,
    blending:    THREE.AdditiveBlending,
  }), []);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position;
    const t   = performance.now() * 0.001;

    for (let i = 0; i < COUNT; i++) {
      // Rise
      pos.array[i * 3 + 1] += velocities[i] * delta;
      // Gentle horizontal wobble
      pos.array[i * 3 + 0] += Math.sin(t + phases[i]) * 0.002;
      pos.array[i * 3 + 2] += Math.cos(t + phases[i] * 0.7) * 0.001;

      // Reset when particle drifts above ceiling
      if (pos.array[i * 3 + 1] > 3.2) {
        const angle  = Math.random() * Math.PI * 2;
        const radius = 1.0 + Math.random() * 2.2;
        pos.array[i * 3 + 0] = 1.6 + Math.cos(angle) * radius;
        pos.array[i * 3 + 1] = -0.7;
        pos.array[i * 3 + 2] = Math.sin(angle) * radius * 0.6;
      }
    }
    pos.needsUpdate = true;
  });

  return <points ref={pointsRef} geometry={geo} material={mat} />;
}

/* ═══════════════════════════════════════════════════════════════════
   GLOW HALO — pulsing gold circle on the floor under the car
   ═══════════════════════════════════════════════════════════════════ */
function GlowHalo() {
  const meshRef = useRef();

  const mat = useMemo(() => new THREE.MeshBasicMaterial({
    color:       new THREE.Color("#c9a84c"),
    transparent: true,
    opacity:     0.18,
    depthWrite:  false,
    blending:    THREE.AdditiveBlending,
    side:        THREE.DoubleSide,
  }), []);

  useFrame(() => {
    if (!meshRef.current) return;
    // Pulse between 0.06 and 0.22 opacity
    const t = performance.now() * 0.001;
    meshRef.current.material.opacity = 0.14 + Math.sin(t * 1.1) * 0.08;
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[1.6, -0.70, 0]}
      material={mat}
    >
      <circleGeometry args={[2.8, 64]} />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CAR — loads GLB, applies materials, handles mouse+scroll rotation
   ═══════════════════════════════════════════════════════════════════ */
function Car() {
  const groupRef    = useRef();
  const { scene }   = useGLTF("/car.glb");
  const materialsApplied = useRef(false);

  // Mouse + scroll state (refs so no re-render)
  const mouse  = useRef({ x: 0 });        // normalised -1…+1
  const scroll = useRef({ y: 0 });        // accumulated scroll delta

  // Damped current values
  const current = useRef({ rotY: 0, tiltX: 0, baseY: 0 });

  useEffect(() => {
    const onMouseMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
    };
    const onScroll = (e) => {
      // Clamp tilt -0.18…+0.18 rad
      scroll.current.y = Math.max(-0.18, Math.min(0.18,
        scroll.current.y + e.deltaY * 0.0004
      ));
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("wheel",     onScroll,     { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("wheel",     onScroll);
    };
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Apply materials once after model is in scene
    if (!materialsApplied.current) {
      applyMaterials(scene);
      materialsApplied.current = true;
    }

    const c   = current.current;
    const α   = 1 - Math.pow(0.04, delta);  // exponential decay — luxurious damping

    // Base slow turntable
    c.baseY += delta * (Math.PI * 2) / 20;

    // Mouse-driven Y rotation offset (-0.6…+0.6 rad extra)
    const targetRotY = mouse.current.x * 0.6;
    c.rotY += (targetRotY - c.rotY) * α;

    // Scroll-driven X tilt
    c.tiltX += (scroll.current.y - c.tiltX) * α;

    groupRef.current.rotation.y = c.baseY + c.rotY;
    groupRef.current.rotation.x = c.tiltX;
    groupRef.current.position.y = -0.12 + Math.sin(c.baseY * 0.8) * 0.04;
  });

  return (
    <group ref={groupRef} position={[1.6, -0.12, 0]} scale={1.2}>
      <primitive object={scene} />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   FLOOR — polished black marble with live car reflection
   ═══════════════════════════════════════════════════════════════════ */
function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.72, 0]} receiveShadow>
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

/* ═══════════════════════════════════════════════════════════════════
   LIGHTS — 5-point cinematic automotive rig
   ═══════════════════════════════════════════════════════════════════ */
function Lights() {
  return (
    <>
      <ambientLight intensity={0.06} />

      {/* KEY — strong white, front-left */}
      <directionalLight
        position={[-4.5, 6, 5]}
        intensity={4.5}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0005}
      />
      {/* Soft secondary key to fill hood/roof */}
      <directionalLight position={[-2, 4, 6]} intensity={1.8} color="#f0f4ff" />

      {/* FILL — deep blue, right side */}
      <directionalLight position={[7, 3, 0]} intensity={1.4} color="#1a3aff" />

      {/* RIM — orange/amber, directly behind */}
      <directionalLight position={[1.6, 3.5, -8]} intensity={3.5} color="#ff7700" />
      <pointLight position={[1.6, 1.5, -5]} intensity={60} color="#ff5500" distance={8} decay={2} />

      {/* UNDER — soft white from below */}
      <pointLight position={[1.6, -0.55, 0]} intensity={14} color="#ddeeff" distance={5} decay={2} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SCENE
   ═══════════════════════════════════════════════════════════════════ */
function Scene() {
  return (
    <Suspense fallback={null}>
      <Lights />
      <Car />
      <Floor />
      <GlowHalo />
      <Particles />
      <Environment preset="studio" />
    </Suspense>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   HERO 3D CANVAS
   Fixed, full-viewport, z-index:-1 — zero layout impact.
   Pure #000000, no alpha channel, no gradients.
   ═══════════════════════════════════════════════════════════════════ */
export default function Hero3DCanvas() {
  return (
    <div style={{
      position:      "fixed",
      top:           0,
      left:          0,
      width:         "100vw",
      height:        "100vh",
      zIndex:        -1,
      pointerEvents: "none",
      background:    "#000000",
    }}>
      <Canvas
        shadows
        camera={{ position: [0, 1.2, 7.5], fov: 40, near: 0.1, far: 100 }}
        gl={{
          alpha:               false,
          antialias:           true,
          toneMapping:         THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.5,
          outputColorSpace:    THREE.SRGBColorSpace,
        }}
        style={{ background: "#000000" }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
