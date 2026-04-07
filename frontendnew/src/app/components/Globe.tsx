"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import { Stars } from "@react-three/drei";

function Scene() {
  const earthRef = useRef<THREE.Mesh>(null!);
  const textRef = useRef<any>(null!);

  // load texture
  const texture = new THREE.TextureLoader().load(
    "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg"
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    textRef.current.material.opacity = Math.min(t * 0.5, 1);
    textRef.current.material.transparent = true;
state.camera.position.x = Math.sin(t * 0.2) * 0.2;
state.camera.lookAt(0, 0, 0);
    const progress = Math.min(t / 4, 1); // 0 → 1 over 4 seconds

// easeOutCubic (smooth slow ending)
    const eased = 1 - Math.pow(1 - progress, 3);
    // 🌍 rotate earth
    earthRef.current.rotation.y += 0.0005;

    // ✨ text rise animation
    if (textRef.current) {
      textRef.current.position.z = -3 + eased * 3;
      textRef.current.position.y = -0.5 + eased * 2.15;
      // slight upward motion
    }
  });

  return (
    <>
      {/* 🌍 Earth */}
      <mesh ref={earthRef} position={[0, -1.5, 0]}>
        <sphereGeometry args={[2.5, 64, 64]} />
        <meshStandardMaterial map={texture} />
      </mesh>
      <mesh position={[0, -1.5, 0]}>
  <sphereGeometry args={[2.65, 64, 64]} />
  <meshBasicMaterial
    color="#00aaff"
    transparent
    opacity={0.08}
  />
</mesh>

      {/* ✨ TEXT (3D) */}
  <Text
  ref={textRef}
  font="/fonts/HoltwoodOneSC-Regular.ttf"
  fontSize={1}
  color="white"
>
  M T R
</Text>
    </>
  );
}

export default function Globe() {
  return (
    <div className="absolute bottom-[-250px] left-1/2 -translate-x-1/2 w-[1000px] h-[900px] z-0">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <Stars
  radius={100}     // how far stars spread
  depth={50}       // depth layers
  count={4000}     // number of stars
  factor={4}       // size
  saturation={0}
  fade
  speed={0.5}      // slow movement
/>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 3, 5]} intensity={1.2} />
        <Scene />
      </Canvas>
    </div>
  );
}