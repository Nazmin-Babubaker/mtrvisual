"use client";
import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Stars } from '@react-three/drei';
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing';

function angularVelocity(r: number, maxR: number): number {
  const normalized = r / maxR;
  return 0.04 / (normalized + 0.08);
}

function GalaxySpiral({ count = 12000, radius = 14, opacity = 1 }: { count?: number; radius?: number; opacity?: number }) {
  const points = useRef<THREE.Points>(null!);

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const angles = new Float32Array(count);
    const radii = new Float32Array(count);

    const coreColor  = new THREE.Color('#a8d4ff');
    const midColor   = new THREE.Color('#ffe8a0');
    const outerColor = new THREE.Color('#ff6040');
    const dustColor  = new THREE.Color('#0a0510');
    const NUM_ARMS = 4;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const roll = Math.random();
      let r: number, baseAngle: number, armOffset: number;
      let isBulge = false;
      let isDust = false;

      if (roll < 0.18) {
        isBulge = true;
        r = Math.pow(Math.random(), 1.5) * radius * 0.22;
        baseAngle = Math.random() * Math.PI * 2;
        armOffset = 0;
      } else if (roll < 0.88) {
        const arm = i % NUM_ARMS;
        baseAngle = (arm / NUM_ARMS) * Math.PI * 2;
        r = Math.pow(Math.random(), 1.8) * radius;
        const windTightness = 0.45;
        armOffset = r * windTightness;
        const armPhase = ((baseAngle + armOffset) % (Math.PI * 2 / NUM_ARMS));
        const nearArmFrac = Math.abs(armPhase - Math.PI / NUM_ARMS) / (Math.PI / NUM_ARMS);
        if (nearArmFrac > 0.55 && r > radius * 0.3 && Math.random() < 0.6) isDust = true;
      } else {
        r = radius * 0.4 + Math.pow(Math.random(), 0.7) * radius * 0.7;
        baseAngle = Math.random() * Math.PI * 2;
        armOffset = 0;
      }

      const scatterScale = isBulge ? 0.6 : 0.18 + (r / radius) * 0.5;
      const randX = (Math.random() - 0.5 + Math.random() - 0.5) * scatterScale * r;
      const randZ = (Math.random() - 0.5 + Math.random() - 0.5) * scatterScale * r;
      const yScale = isBulge
        ? Math.pow(Math.random(), 2) * 0.55 * r
        : Math.pow(Math.random(), 4) * 0.04 * r + (Math.random() - 0.5) * 0.06;
      const randY = (Math.random() < 0.5 ? 1 : -1) * yScale;

      const finalAngle = baseAngle + (armOffset || 0);
      positions[i3]     = Math.cos(finalAngle) * r + randX;
      positions[i3 + 1] = randY;
      positions[i3 + 2] = Math.sin(finalAngle) * r + randZ;
      angles[i] = finalAngle;
      radii[i]  = r;

      let mixedColor: THREE.Color;
      if (isDust) {
        mixedColor = dustColor.clone();
      } else {
        const t = Math.min(r / radius, 1);
        mixedColor = t < 0.35
          ? coreColor.clone().lerp(midColor, t / 0.35)
          : midColor.clone().lerp(outerColor, (t - 0.35) / 0.65);
        if (isBulge) mixedColor.lerp(coreColor, 0.4);
      }

      colors[i3]     = mixedColor.r;
      colors[i3 + 1] = mixedColor.g;
      colors[i3 + 2] = mixedColor.b;
    }

    return { positions, colors, angles, radii };
  }, [count, radius]);

  useFrame((_state, delta) => {
    if (!points.current) return;
    const posArr = points.current.geometry.attributes.position.array as Float32Array;
    const { angles, radii } = particles;
    for (let i = 0; i < count; i++) {
      const r = radii[i];
      if (r < 0.01) continue;
      angles[i] += angularVelocity(r, radius) * delta;
      const i3 = i * 3;
      const curX = posArr[i3], curZ = posArr[i3 + 2];
      const curR = Math.sqrt(curX * curX + curZ * curZ) || r;
      posArr[i3]     = Math.cos(angles[i]) * curR;
      posArr[i3 + 2] = Math.sin(angles[i]) * curR;
    }
    points.current.geometry.attributes.position.needsUpdate = true;
    if (points.current.material) {
      (points.current.material as THREE.PointsMaterial).opacity = opacity * 0.92;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particles.positions.length / 3} array={particles.positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={particles.colors.length / 3} array={particles.colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        sizeAttenuation
        depthWrite={false}
        vertexColors
        blending={THREE.AdditiveBlending}
        transparent
        opacity={0}
      />
    </points>
  );
}

function NebulaCoreGlow() {
  const meshRef = useRef<THREE.Mesh>(null!);

  const texture = useMemo(() => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0,    'rgba(220, 210, 255, 0.95)');
    grad.addColorStop(0.08, 'rgba(160, 180, 255, 0.75)');
    grad.addColorStop(0.25, 'rgba(80,  100, 200, 0.40)');
    grad.addColorStop(0.55, 'rgba(20,  30,  120, 0.12)');
    grad.addColorStop(1,    'rgba(0,   0,   0,   0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(canvas);
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    const pulse = 1 + Math.sin(t * 0.4) * 0.06;
    meshRef.current.scale.setScalar(pulse);
    (meshRef.current.material as THREE.MeshBasicMaterial).opacity =
      0.55 + Math.sin(t * 0.3) * 0.08;
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]} rotation={[-Math.PI / 2.2, 0, 0]}>
      <planeGeometry args={[6, 6]} />
      <meshBasicMaterial
        map={texture}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        opacity={0.55}
      />
    </mesh>
  );
}

function SatelliteClusters() {
  const clusters = useMemo(() => {
    const defs = [
      { cx: 18,  cy: 3,  cz: 12,  n: 180, spread: 2.2 },
      { cx: -20, cy: -2, cz: -8,  n: 140, spread: 1.8 },
      { cx: 10,  cy: 5,  cz: -18, n: 100, spread: 1.5 },
    ];
    return defs.map(({ cx, cy, cz, n, spread }) => {
      const positions = new Float32Array(n * 3);
      const colors = new Float32Array(n * 3);
      const base = new THREE.Color('#c8d8ff');
      for (let i = 0; i < n; i++) {
        positions[i * 3]     = cx + (Math.random() + Math.random() - 1) * spread;
        positions[i * 3 + 1] = cy + (Math.random() + Math.random() - 1) * spread * 0.4;
        positions[i * 3 + 2] = cz + (Math.random() + Math.random() - 1) * spread;
        const c = base.clone().lerp(new THREE.Color('#ffffff'), Math.random() * 0.4);
        colors[i * 3]     = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
      }
      return { positions, colors };
    });
  }, []);

  return (
    <>
      {clusters.map((c, idx) => (
        <points key={idx}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={c.positions.length / 3} array={c.positions} itemSize={3} />
            <bufferAttribute attach="attributes-color" count={c.colors.length / 3} array={c.colors} itemSize={3} />
          </bufferGeometry>
          <pointsMaterial
            size={0.05}
            sizeAttenuation
            depthWrite={false}
            vertexColors
            blending={THREE.AdditiveBlending}
            transparent
            opacity={0.7}
          />
        </points>
      ))}
    </>
  );
}

function CameraDrift() {
  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.012;
    state.camera.position.x = Math.sin(t) * 1.2;
    state.camera.position.y = 2 + Math.sin(t * 0.7) * 0.8;
    state.camera.position.z = 8 + Math.cos(t * 0.5) * 1.5;
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function HeroScene() {
  const [fadeOpacity, setFadeOpacity] = useState(0);

  useEffect(() => {
    let start: number | null = null;
    const duration = 3000;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setFadeOpacity(1 - Math.pow(1 - progress, 3)); // ease-out cubic
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, []);

  return (
    <div className="absolute inset-0 z-0 h-full w-full pointer-events-none">
      {/* Three.js canvas with cinematic fade-in */}
      <div className="absolute inset-0" style={{ opacity: fadeOpacity }}>
        <Canvas
          camera={{ position: [0, 2, 8], fov: 60 }}
          gl={{ antialias: false, alpha: true }}
        >
          <color attach="background" args={['#000000']} />
          <CameraDrift />
          <NebulaCoreGlow />
          <GalaxySpiral count={12000} radius={14} opacity={fadeOpacity} />
          <SatelliteClusters />
          <Stars
            radius={120}
            depth={60}
            count={6000}
            factor={3.5}
            saturation={0.2}
            fade
            speed={0.3}
          />
          <EffectComposer disableNormalPass>
            <Bloom
              luminanceThreshold={0.08}
              mipmapBlur
              intensity={1.8}
              radius={0.45}
            />
            <Vignette eskil={false} offset={0.15} darkness={1.1} />
            <Noise opacity={0.032} />
          </EffectComposer>
        </Canvas>
      </div>

      {/* Scanline overlay — CRT/terminal texture that matches your monospace UI */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.13) 2px, rgba(0,0,0,0.13) 4px)',
          backgroundSize: '100% 4px',
          opacity: fadeOpacity * 0.6,
          mixBlendMode: 'multiply',
          zIndex: 1,
        }}
      />
    </div>
  );
}