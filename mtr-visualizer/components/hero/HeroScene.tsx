"use client";
import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Stars } from '@react-three/drei';
import { Bloom, EffectComposer, Noise } from '@react-three/postprocessing';

// Differential rotation: inner stars orbit faster (like real spiral galaxies)
function angularVelocity(r: number, maxR: number): number {
  // Flat rotation curve approximation — fast rise, then plateau
  const normalized = r / maxR;
  return 0.12 / (normalized + 0.08);
}

function GalaxySpiral({ count = 12000, radius = 14 }) {
  const points = useRef<THREE.Points>(null!);
  // Store per-particle angle offsets and radii for differential rotation
  const particleData = useRef<Float32Array | null>(null);

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const angles = new Float32Array(count);   // current angle
    const radii = new Float32Array(count);    // orbital radius

    // Color stops: hot blue-white core → warm yellow mid → cool dim red outer
    const coreColor   = new THREE.Color('#a8d4ff'); // hot blue-white
    const midColor    = new THREE.Color('#ffe8a0'); // warm yellow
    const outerColor  = new THREE.Color('#ff6040'); // cool red-orange
    const dustColor   = new THREE.Color('#0a0510');  // near-black for dust lanes

    const NUM_ARMS = 4;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Decide if this is a bulge particle, arm particle, or halo particle
      const roll = Math.random();
      let r: number, baseAngle: number, armOffset: number;
      let isBulge = false;
      let isDust = false;

      if (roll < 0.18) {
        // Central bulge — tight exponential cluster with vertical puff
        isBulge = true;
        r = Math.pow(Math.random(), 1.5) * radius * 0.22;
        baseAngle = Math.random() * Math.PI * 2;
        armOffset = 0;
      } else if (roll < 0.88) {
        // Spiral arm particles
        const arm = i % NUM_ARMS;
        baseAngle = (arm / NUM_ARMS) * Math.PI * 2;
        r = Math.pow(Math.random(), 1.8) * radius;

        // Tighter arms with logarithmic spiral winding
        const windTightness = 0.45;
        armOffset = r * windTightness;

        // Dust lanes: particles between arms are darker (inter-arm dust)
        const armPhase = ((baseAngle + armOffset) % (Math.PI * 2 / NUM_ARMS));
        const nearArmFrac = Math.abs(armPhase - Math.PI / NUM_ARMS) / (Math.PI / NUM_ARMS);
        if (nearArmFrac > 0.55 && r > radius * 0.3 && Math.random() < 0.6) {
          isDust = true;
        }
      } else {
        // Sparse halo/outer disc
        r = radius * 0.4 + Math.pow(Math.random(), 0.7) * radius * 0.7;
        baseAngle = Math.random() * Math.PI * 2;
        armOffset = 0;
      }

      // Gaussian scatter perpendicular to arm (tighter near centre)
      const scatterScale = isBulge ? 0.6 : 0.18 + (r / radius) * 0.5;
      const randX = (Math.random() - 0.5 + Math.random() - 0.5) * scatterScale * r;
      const randZ = (Math.random() - 0.5 + Math.random() - 0.5) * scatterScale * r;

      // Vertical thickness — thicker in bulge, thin disc elsewhere
      const yScale = isBulge
        ? Math.pow(Math.random(), 2) * 0.55 * r
        : Math.pow(Math.random(), 4) * 0.04 * r + (Math.random() - 0.5) * 0.06;
      const randY = (Math.random() < 0.5 ? 1 : -1) * yScale;

      const finalAngle = baseAngle + (armOffset || 0);
      const x = Math.cos(finalAngle) * r + randX;
      const z = Math.sin(finalAngle) * r + randZ;

      positions[i3]     = x;
      positions[i3 + 1] = randY;
      positions[i3 + 2] = z;

      angles[i] = finalAngle;
      radii[i]  = r;

      // Color: lerp across two gradients based on r
      let mixedColor: THREE.Color;
      if (isDust) {
        mixedColor = dustColor.clone();
      } else {
        const t = Math.min(r / radius, 1);
        if (t < 0.35) {
          mixedColor = coreColor.clone().lerp(midColor, t / 0.35);
        } else {
          mixedColor = midColor.clone().lerp(outerColor, (t - 0.35) / 0.65);
        }
        // Bulge stars are slightly brighter / bluer
        if (isBulge) mixedColor.lerp(coreColor, 0.4);
      }

      colors[i3]     = mixedColor.r;
      colors[i3 + 1] = mixedColor.g;
      colors[i3 + 2] = mixedColor.b;

      // Size variation — occasional bright foreground stars
      const brightStar = Math.random() < 0.003;
      sizes[i] = brightStar
        ? 0.06 + Math.random() * 0.06
        : isBulge
          ? 0.025 + Math.random() * 0.015
          : 0.012 + Math.random() * 0.025;
    }

    particleData.current = radii;
    return { positions, colors, sizes, angles, radii };
  }, [count, radius]);

  // Differential rotation frame update
  useFrame((_state, delta) => {
    if (!points.current) return;
    const posArr = points.current.geometry.attributes.position.array as Float32Array;
    const { angles, radii } = particles;

    for (let i = 0; i < count; i++) {
      const r = radii[i];
      if (r < 0.01) continue;
      const omega = angularVelocity(r, radius) * delta;
      angles[i] += omega;

      const i3 = i * 3;
      const cos = Math.cos(angles[i]);
      const sin = Math.sin(angles[i]);
      // Preserve original radial distance, update x/z
      const curX = posArr[i3];
      const curZ = posArr[i3 + 2];
      const curR = Math.sqrt(curX * curX + curZ * curZ) || r;
      posArr[i3]     = cos * curR;
      posArr[i3 + 2] = sin * curR;
    }
    points.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.positions.length / 3}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particles.colors.length / 3}
          array={particles.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        sizeAttenuation={true}
        depthWrite={false}
        vertexColors
        blending={THREE.AdditiveBlending}
        transparent
        opacity={0.92}
      />
    </points>
  );
}

// Slow orbital camera drift for depth
function CameraDrift() {
  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.04;
    state.camera.position.x = Math.sin(t) * 1.2;
    state.camera.position.y = 2 + Math.sin(t * 0.7) * 0.8;
    state.camera.position.z = 8 + Math.cos(t * 0.5) * 1.5;
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function HeroScene() {
  return (
    <div className="absolute inset-0 z-0 h-full w-full pointer-events-none">
      <Canvas
        camera={{ position: [0, 2, 8], fov: 60 }}
        gl={{ antialias: false, alpha: true }}
      >
        <color attach="background" args={['#000000']} />

        <CameraDrift />
        <GalaxySpiral count={12000} radius={14} />
        <Stars
          radius={120}
          depth={60}
          count={6000}
          factor={3.5}
          saturation={0.2}
          fade
          speed={0.8}
        />

        <EffectComposer disableNormalPass>
          <Bloom
            luminanceThreshold={0.08}
            mipmapBlur
            intensity={1.8}
            radius={0.45}
          />
          <Noise opacity={0.04} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}