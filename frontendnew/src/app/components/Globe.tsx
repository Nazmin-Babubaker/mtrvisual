"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

function Earth() {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame(() => {
    meshRef.current.rotation.y += 0.0005; // slow rotation
  });

  const texture = new THREE.TextureLoader().load(
    "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg"
  );

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[3,70 , 70]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}

export default function Globe() {
  return (
    <div className="absolute bottom-[-300px] left-1/2 -translate-x-1/2 w-[900px] h-[900px] z-0">
      <Canvas camera={{ position: [0, 0, 6] }}>
        <ambientLight intensity={0.5} />
        <Earth />
      </Canvas>
    </div>
  );
}