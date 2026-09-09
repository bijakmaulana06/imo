"use client";

import { Component, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import type { MotionValue } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Group, MathUtils } from "three";

function Sculpture({ reducedMotion, progress, journey, interaction }: { reducedMotion: boolean; progress?: MotionValue<number>; journey?: MotionValue<number>; interaction: RefObject<{ yaw: number; pitch: number }> }) {
  const orbit = useRef<Group>(null);
  const core = useRef<Group>(null);
  const stars = useMemo(() => Float32Array.from({ length: 720 }, (_, i) => Math.sin(i * 127.1 + 43.2) * (i % 3 === 2 ? 9 : 11)), []);
  useFrame(({ clock, pointer, camera }, delta) => {
    if (!orbit.current || reducedMotion) return;
    const travel = MathUtils.clamp(progress?.get() ?? window.scrollY / Math.max(window.innerHeight, 1), 0, 1);
    const world = journey?.get() ?? 0;
    const beyond = MathUtils.smoothstep(travel, .9, 1);
    const dt = Math.min(delta, .05);
    orbit.current.rotation.y = MathUtils.damp(orbit.current.rotation.y, Math.sin(clock.elapsedTime * .12) * .12 + pointer.x * .16 + travel * 2.6 + world * 12 + interaction.current.yaw, 3, dt);
    orbit.current.rotation.x = MathUtils.damp(orbit.current.rotation.x, pointer.y * .12 + travel * .7 + interaction.current.pitch, 3, dt);
    orbit.current.position.x = MathUtils.damp(orbit.current.position.x, 1.85 * (1 - travel) + Math.sin(world * Math.PI * 5) * 2.7 * beyond, 3, dt);
    orbit.current.position.y = Math.sin(clock.elapsedTime * .5) * .07 + Math.sin(world * Math.PI * 4) * beyond;
    orbit.current.rotation.z = MathUtils.damp(orbit.current.rotation.z, -.28 + world * 3, 3, dt);
    camera.position.z = MathUtils.damp(camera.position.z, 7.6 - travel * 4.6 + Math.sin(world * Math.PI * 3) * 1.2 * beyond, 3, dt);
    camera.position.x = MathUtils.damp(camera.position.x, pointer.x * .15, 2, dt);
    if (core.current) core.current.scale.setScalar(1 - travel * .88);
  });
  return (
    <>
      <ambientLight intensity={0.3} />
      <spotLight position={[4, 6, 5]} intensity={70} color="#eee3d1" angle={0.5} penumbra={1} />
      <pointLight position={[-4, 0, -2]} intensity={25} color="#8ea9b8" />
      <points><bufferGeometry><bufferAttribute attach="attributes-position" args={[stars, 3]} /></bufferGeometry><pointsMaterial color="#d1c099" size={.018} transparent opacity={.42} sizeAttenuation depthWrite={false} /></points>
      <group ref={orbit} position={[1.85, 0, 0]} rotation={[0.18, 0, -0.28]}>
        <mesh rotation={[1.1, 0.45, 0]}>
          <torusGeometry args={[2.03, 0.068, 20, 160]} />
          <meshStandardMaterial color="#c6bb9f" metalness={1} roughness={0.19} />
        </mesh>
        <mesh rotation={[0.36, -0.64, 0.4]}>
          <torusGeometry args={[1.69, 0.19, 32, 160]} />
          <meshStandardMaterial color="#ddd7cb" metalness={1} roughness={0.13} />
        </mesh>
        <mesh rotation={[0.9, 0.3, -0.8]}>
          <torusGeometry args={[1.3, 0.022, 12, 128]} />
          <meshStandardMaterial color="#ead5a6" metalness={0.7} roughness={0.24} emissive="#a38955" emissiveIntensity={0.25} />
        </mesh>
        <group ref={core}><mesh>
          <sphereGeometry args={[0.85, 64, 64]} />
          <meshStandardMaterial color="#e4ddcd" metalness={1} roughness={0.18} />
        </mesh></group>
        <mesh position={[1.78, 0.78, 0.28]}>
          <sphereGeometry args={[0.14, 24, 24]} />
          <meshStandardMaterial color="#e3cf9b" metalness={1} roughness={0.15} />
        </mesh>
      </group>
      <Environment resolution={128}>
        <Lightformer position={[0, 4, 3]} scale={[8, 2, 1]} intensity={4} color="#ffffff" />
        <Lightformer position={[-4, 0, 1]} rotation={[0, Math.PI / 2, 0]} scale={[2, 7, 1]} intensity={3} color="#bfd0df" />
        <Lightformer position={[5, -2, 0]} rotation={[0, -Math.PI / 2, 0]} scale={[2, 5, 1]} intensity={4} color="#e4c58c" />
      </Environment>
    </>
  );
}

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function OrbitalScene({ reducedMotion, progress, journey }: { reducedMotion: boolean; progress?: MotionValue<number>; journey?: MotionValue<number> }) {
  const host = useRef<HTMLDivElement>(null);
  const interaction = useRef({ yaw: 0, pitch: 0 });
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting && !document.hidden));
    if (host.current) observer.observe(host.current);
    const onVisibility = () => { const bounds = host.current?.getBoundingClientRect(); setVisible(!document.hidden && !!bounds && bounds.bottom > 0 && bounds.top < innerHeight); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);
  return (
    <div ref={host} style={{ width: "100%", height: "100%", touchAction: "pan-y", cursor: reducedMotion ? "default" : "grab" }} aria-hidden="true"
      onPointerDown={event => { if (reducedMotion || event.button !== 0) return; drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); event.currentTarget.style.cursor = "grabbing"; }}
      onPointerMove={event => { const last = drag.current; if (!last || last.id !== event.pointerId) return; interaction.current.yaw += (event.clientX - last.x) * .008; interaction.current.pitch = MathUtils.clamp(interaction.current.pitch + (event.clientY - last.y) * .005, -.7, .7); last.x = event.clientX; last.y = event.clientY; }}
      onPointerUp={event => { drag.current = null; event.currentTarget.style.cursor = reducedMotion ? "default" : "grab"; }}
      onPointerCancel={event => { drag.current = null; event.currentTarget.style.cursor = reducedMotion ? "default" : "grab"; }}>
      <SceneBoundary>
        <Canvas camera={{ position: [0, 0, 7.6], fov: 44 }} dpr={[1, 1.5]} frameloop={visible && !reducedMotion ? "always" : "demand"} gl={{ alpha: true, antialias: true, powerPreference: "low-power" }} fallback={<span />}>
          <Sculpture reducedMotion={reducedMotion} progress={progress} journey={journey} interaction={interaction} />
        </Canvas>
      </SceneBoundary>
    </div>
  );
}
