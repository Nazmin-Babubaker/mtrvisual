"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useMemo, Suspense } from "react";
import * as THREE from "three";
import { Stars } from "@react-three/drei";

function EarthMesh() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const cloudsRef = useRef<THREE.Mesh>(null!);

  const [dayMap, cloudsMap] = useMemo(() => {
    const loader = new THREE.TextureLoader();
    return [
      loader.load(
        "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg"
      ),
      loader.load(
        "https://threejs.org/examples/textures/planets/earth_clouds_1024.png"
      ),
    ];
  }, []);

  useFrame((_, delta) => {
    meshRef.current.rotation.y += delta * 0.055;
    cloudsRef.current.rotation.y += delta * 0.068;
  });

  return (
    <>
      {/* Earth surface */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[2.4, 128, 128]} />
        <meshPhongMaterial
          map={dayMap}
          specular={new THREE.Color(0x1a3a5c)}
          shininess={20}
        />
      </mesh>

      {/* Cloud layer */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[2.435, 64, 64]} />
        <meshPhongMaterial
          map={cloudsMap}
          transparent
          opacity={0.36}
          depthWrite={false}
        />
      </mesh>

      {/* Atmosphere inner blue tint */}
      <mesh>
        <sphereGeometry args={[2.52, 64, 64]} />
        <meshBasicMaterial
          color="#1a55cc"
          transparent
          opacity={0.065}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Outer atmospheric rim */}
      <mesh>
        <sphereGeometry args={[2.78, 64, 64]} />
        <meshBasicMaterial
          color="#3377ff"
          transparent
          opacity={0.03}
          side={THREE.BackSide}
        />
      </mesh>
    </>
  );
}

function FloatingGroup() {
  const ref = useRef<THREE.Group>(null!);
  useFrame((state) => {
    ref.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.22) * 0.07;
  });
  return (
    <group ref={ref} position={[1.2, -0.3, 0]}>
      <EarthMesh />
    </group>
  );
}

export default function Globe() {
  return (
    <div
      style={{
        position: "absolute",
        right: "-2%",
        top: "50%",
        transform: "translateY(-50%)",
        width: "800px",
        height: "900px",
        zIndex: 1,
        pointerEvents: "none",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 6.2], fov: 36 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Stars
          radius={180}
          depth={60}
          count={6500}
          factor={4.5}
          saturation={0}
          fade
          speed={0.18}
        />
        {/* Sun from upper-right to match design */}
        <directionalLight position={[3, 4, 5]} intensity={2.4} color="#fff8f0" />
        <ambientLight intensity={0.15} />

        <Suspense fallback={null}>
          <FloatingGroup />
        </Suspense>
      </Canvas>
    </div>
  );
}