"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/* ─────────────────────── WebGL Availability Check ─────────────────────── */
function checkWebGLSupport(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch (e) {
    return false;
  }
}

/* ─────────────────────── React Error Boundary for Mobile WebGL ─────────────────────── */
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class WebGLErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.warn("WebGL renderer fallback engaged due to mobile GPU constraint:", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/* ─────────────────────── CSS Starfield Fallback (100% Mobile Safe) ─────────────────────── */
function CSSStarfieldFallback() {
  return (
    <div className="fixed inset-0 -z-50 pointer-events-none overflow-hidden bg-[#020510]">
      {/* Dynamic Cosmic Gradient Stars */}
      <div 
        className="absolute inset-0 opacity-80"
        style={{
          backgroundImage: `
            radial-gradient(1.5px 1.5px at 15% 15%, rgba(255, 255, 255, 0.9), transparent),
            radial-gradient(2px 2px at 35% 45%, rgba(125, 249, 255, 0.8), transparent),
            radial-gradient(1px 1px at 60% 25%, rgba(255, 255, 255, 0.7), transparent),
            radial-gradient(2.5px 2.5px at 80% 70%, rgba(180, 140, 255, 0.85), transparent),
            radial-gradient(1.5px 1.5px at 25% 85%, rgba(255, 255, 255, 0.75), transparent),
            radial-gradient(2px 2px at 70% 15%, rgba(125, 249, 255, 0.9), transparent),
            radial-gradient(1px 1px at 90% 40%, rgba(255, 255, 255, 0.8), transparent)
          `,
          backgroundSize: "250px 250px",
        }}
      />
      {/* Volumetric Nebula Glow Clouds */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[radial-gradient(circle,rgba(125,249,255,0.12)_0%,rgba(180,140,255,0.08)_35%,transparent_70%)] filter blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(255,113,206,0.1)_0%,rgba(0,240,255,0.05)_45%,transparent_70%)] filter blur-3xl" />
      {/* Dark Vignette Contrast Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,rgba(2,5,16,0.85)_100%)]" />
    </div>
  );
}

/* ─────────────────────── Procedural Soft Glow Texture Generator ─────────────────────── */
function createSoftGlowTexture() {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.25, "rgba(255, 255, 255, 0.7)");
  gradient.addColorStop(0.6, "rgba(255, 255, 255, 0.15)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/* ─────────────────────── 1. Galaxy Particle System ─────────────────────── */
function GalaxyParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const { size } = useThree();

  const isMobile = size.width < 768;
  const PARTICLE_COUNT = isMobile ? 12000 : 35000;
  const ARMS = 5;
  const SPIRAL_TIGHTNESS = 0.38;
  const GALAXY_RADIUS = 18;
  const GALAXY_THICKNESS = 0.8;
  const CORE_DENSITY = 3.2;

  const { positions, colors, sizes, randomOffsets } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const col = new Float32Array(PARTICLE_COUNT * 3);
    const sz = new Float32Array(PARTICLE_COUNT);
    const offsets = new Float32Array(PARTICLE_COUNT);

    const colorCore = new THREE.Color("#7df9ff");
    const colorMid = new THREE.Color("#00f0ff");
    const colorOuter = new THREE.Color("#b48cff");
    const colorDust = new THREE.Color("#ff71ce");
    const colorCyan = new THREE.Color("#00f0ff");

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const isCore = Math.random() < 0.22;

      let x: number, y: number, z: number;
      const mixColor = new THREE.Color();

      if (isCore) {
        const r = Math.pow(Math.random(), CORE_DENSITY) * GALAXY_RADIUS * 0.25;
        const theta = Math.random() * Math.PI * 2;
        x = Math.cos(theta) * r;
        z = Math.sin(theta) * r;
        y = (Math.random() - 0.5) * GALAXY_THICKNESS * 0.6;

        mixColor.lerpColors(colorCore, colorMid, Math.random() * 0.5);
        sz[i] = Math.random() * 2.5 + 1.0;
      } else {
        const armIndex = Math.floor(Math.random() * ARMS);
        const armAngle = (armIndex / ARMS) * Math.PI * 2;

        const distanceRatio = Math.pow(Math.random(), 1.4);
        const r = distanceRatio * GALAXY_RADIUS;

        const spiralAngle = armAngle + r * SPIRAL_TIGHTNESS;
        const scatter = (Math.random() - 0.5) * 1.5 * (0.2 + distanceRatio * 0.8);

        x = Math.cos(spiralAngle) * r + Math.cos(spiralAngle + Math.PI / 2) * scatter;
        z = Math.sin(spiralAngle) * r + Math.sin(spiralAngle + Math.PI / 2) * scatter;
        y = (Math.random() - 0.5) * GALAXY_THICKNESS * (1.2 - distanceRatio * 0.7);

        if (distanceRatio < 0.3) {
          mixColor.lerpColors(colorCore, colorMid, distanceRatio / 0.3);
        } else if (distanceRatio < 0.7) {
          mixColor.lerpColors(colorMid, colorCyan, (distanceRatio - 0.3) / 0.4);
        } else {
          mixColor.lerpColors(colorOuter, colorDust, (distanceRatio - 0.7) / 0.3);
        }

        sz[i] = Math.random() * 2.0 + 0.4;
      }

      const brightness = 0.7 + Math.random() * 0.3;
      mixColor.multiplyScalar(brightness);

      pos[i3] = x;
      pos[i3 + 1] = y;
      pos[i3 + 2] = z;

      col[i3] = mixColor.r;
      col[i3 + 1] = mixColor.g;
      col[i3 + 2] = mixColor.b;

      offsets[i] = Math.random() * Math.PI * 2;
    }

    return { positions: pos, colors: col, sizes: sz, randomOffsets: offsets };
  }, [PARTICLE_COUNT]);

  const shaderMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 1.5) : 1 },
        },
        vertexShader: `
          attribute float aSize;
          attribute float aOffset;
          uniform float uTime;
          uniform float uPixelRatio;
          varying vec3 vColor;
          varying float vAlpha;

          void main() {
            vColor = color;

            vec4 modelPosition = modelMatrix * vec4(position, 1.0);
            vec4 viewPosition = viewMatrix * modelPosition;
            vec4 projectedPosition = projectionMatrix * viewPosition;
            gl_Position = projectedPosition;

            float twinkle = 0.6 + 0.4 * sin(uTime * 2.0 + aOffset * 6.28);
            vAlpha = twinkle;

            gl_PointSize = aSize * uPixelRatio * 45.0 * (1.0 / -viewPosition.z);
            gl_PointSize = max(gl_PointSize, 0.6);
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          varying float vAlpha;

          void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;

            float strength = 1.0 - (dist * 2.0);
            strength = pow(strength, 1.6);

            float core = 1.0 - smoothstep(0.0, 0.12, dist);

            vec3 finalColor = vColor * strength + vec3(0.5, 0.8, 1.0) * core * 0.3;
            float alpha = strength * vAlpha * 0.85;

            gl_FragColor = vec4(finalColor, alpha);
          }
        `,
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  useFrame((state) => {
    const elapsed = state.clock.elapsedTime;
    if (pointsRef.current) {
      pointsRef.current.rotation.y = elapsed * 0.055;
    }
    if (shaderMaterial.uniforms) {
      shaderMaterial.uniforms.uTime.value = elapsed;
    }
  });

  return (
    <points ref={pointsRef} material={shaderMaterial}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aOffset" args={[randomOffsets, 1]} />
      </bufferGeometry>
    </points>
  );
}

/* ─────────────────────── 2. Organic Soft Volumetric Nebula Dust ─────────────────────── */
function OrganicNebulaClouds() {
  const pointsRef = useRef<THREE.Points>(null);
  const glowTexture = useMemo(() => createSoftGlowTexture(), []);

  const { positions, colors, sizes } = useMemo(() => {
    const COUNT = 220;
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);
    const sz = new Float32Array(COUNT);

    const colorsList = [
      new THREE.Color("#7df9ff"),
      new THREE.Color("#b48cff"),
      new THREE.Color("#ff71ce"),
      new THREE.Color("#00f0ff"),
    ];

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      const r = Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 5;

      pos[i3] = Math.cos(theta) * r;
      pos[i3 + 1] = y;
      pos[i3 + 2] = Math.sin(theta) * r;

      const baseColor = colorsList[Math.floor(Math.random() * colorsList.length)];
      col[i3] = baseColor.r;
      col[i3 + 1] = baseColor.g;
      col[i3 + 2] = baseColor.b;

      sz[i] = 12 + Math.random() * 16;
    }

    return { positions: pos, colors: col, sizes: sz };
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.025;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={glowTexture || undefined}
        vertexColors
        size={14}
        sizeAttenuation
        transparent
        opacity={0.06}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* ─────────────────────── 3. Background Star Field ─────────────────────── */
function BackgroundStars() {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const COUNT = 4000;
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);

    const colorWhite = new THREE.Color("#ffffff");
    const colorFaint = new THREE.Color("#7db8ff");

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 40 + Math.random() * 90;

      pos[i3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i3 + 2] = r * Math.cos(phi);

      const mixColor = new THREE.Color();
      mixColor.lerpColors(colorFaint, colorWhite, Math.random());
      col[i3] = mixColor.r;
      col[i3 + 1] = mixColor.g;
      col[i3 + 2] = mixColor.b;
    }

    return { positions: pos, colors: col };
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.015;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial vertexColors size={0.22} sizeAttenuation transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

/* ─────────────────────── 4. Camera Rig ─────────────────────── */
function CameraRig() {
  const { camera } = useThree();
  const targetScrollY = useRef(0);
  const currentScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      targetScrollY.current = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll();
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  useFrame((state, delta) => {
    // Smooth out scroll step jumps to eliminate wheel tick jitter
    currentScrollY.current = THREE.MathUtils.damp(currentScrollY.current, targetScrollY.current, 4, delta);

    const t = state.clock.elapsedTime;
    
    const pointerX = state.pointer.x * 2.2;
    const pointerY = state.pointer.y * 1.5;

    const idleX = Math.sin(t * 0.15) * 2.0 + pointerX;
    const idleY = 9 + Math.sin(t * 0.12) * 1.2 + pointerY;
    const idleZ = 20 + Math.cos(t * 0.1) * 1.5;

    const scrollZ = currentScrollY.current * -10; 
    const scrollX = Math.sin(currentScrollY.current * Math.PI) * 4;
    const scrollY_pos = currentScrollY.current * -2;

    const targetX = idleX + scrollX;
    const targetY = idleY + scrollY_pos;
    const targetZ = idleZ + scrollZ;

    camera.position.x = THREE.MathUtils.damp(camera.position.x, targetX, 3, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, targetY, 3, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 3, delta);

    // KUNCI UTAMA STABILITAS: lookAt murni tanpa manipulasi rotation.z manual yang memicu konflik matriks & getaran
    camera.lookAt(0, 0, 0);
  });

  return null;
}

/* ─────────────────────── Main Component (SSR & Mobile WebGL Safe) ─────────────────────── */
export default function StarfieldBackground() {
  const [mounted, setMounted] = useState(false);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    setMounted(true);
    setHasWebGL(checkWebGLSupport());
  }, []);

  if (!mounted) {
    return <div className="fixed inset-0 -z-50 bg-[#020510]" />;
  }

  if (!hasWebGL) {
    return <CSSStarfieldFallback />;
  }

  return (
    <WebGLErrorBoundary fallback={<CSSStarfieldFallback />}>
      <div className="fixed inset-0 -z-50 pointer-events-none">
        <Canvas
          gl={{
            antialias: false,
            alpha: true,
            powerPreference: "default",
            failIfMajorPerformanceCaveat: false,
          }}
          dpr={[1, 1.5]}
          camera={{ position: [0, 9, 20], fov: 55, near: 0.1, far: 200 }}
          style={{ background: "linear-gradient(180deg, #020510 0%, #050917 50%, #080d1e 100%)" }}
        >
          <CameraRig />
          <ambientLight intensity={0.4} />

          {/* 3D Photorealistic Galaxy Particles */}
          <GalaxyParticles />

          {/* Soft Organic Volumetric Nebula Clouds */}
          <OrganicNebulaClouds />

          {/* Deep Space Background Star Field */}
          <BackgroundStars />
        </Canvas>
      </div>

      {/* Dark Space Vignette Contrast Overlay */}
      <div className="fixed inset-0 -z-40 bg-[#020510]/35 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(2,5,16,0.85)_100%)] pointer-events-none" />
    </WebGLErrorBoundary>
  );
}
