
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Sparkles, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../store';
import { TreeState } from '../types';

const Tree: React.FC = () => {
  const treeState = useStore(state => state.treeState);
  const rotationY = useStore(state => state.rotationY);
  const treeGroupRef = useRef<THREE.Group>(null);
  const goldSpiralRef = useRef<THREE.Points>(null);

  // 1. Particle distribution for the "foggy layers"
  const { treeParticles, outerFogParticles, starParticles } = useMemo(() => {
    const treePts = new Float32Array(10000 * 3);
    const outerFogPts = new Float32Array(3000 * 3);
    const starPts = new Float32Array(800 * 3);
    
    // Core Tree: Dense distribution
    for (let i = 0; i < 10000; i++) {
      const y = Math.random() * 7 - 1; 
      const normalizedY = (y + 1) / 7;
      const radius = (1 - normalizedY) * 3 * Math.pow(Math.random(), 0.6);
      const angle = Math.random() * Math.PI * 2;
      
      treePts[i * 3] = Math.cos(angle) * radius;
      treePts[i * 3 + 1] = y;
      treePts[i * 3 + 2] = Math.sin(angle) * radius;
    }

    // Outer Fog: Sparse and wider
    for (let i = 0; i < 3000; i++) {
      const y = Math.random() * 7 - 1;
      const normalizedY = (y + 1) / 7;
      const radius = (1 - normalizedY) * 3.5 * Math.pow(Math.random(), 0.8);
      const angle = Math.random() * Math.PI * 2;
      
      outerFogPts[i * 3] = Math.cos(angle) * radius;
      outerFogPts[i * 3 + 1] = y;
      outerFogPts[i * 3 + 2] = Math.sin(angle) * radius;
    }

    // Star: Burst pattern with core focus
    for (let i = 0; i < 800; i++) {
      const angle = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.pow(Math.random(), 2) * 1.2; // Concentrated at center
      starPts[i * 3] = r * Math.sin(phi) * Math.cos(angle);
      starPts[i * 3 + 1] = 6.2 + r * Math.sin(phi) * Math.sin(angle);
      starPts[i * 3 + 2] = r * Math.cos(phi);
    }

    return { treeParticles: treePts, outerFogParticles: outerFogPts, starParticles: starPts };
  }, []);

  // 2. Gold spiral micro-particles (silk light ribbons)
  const goldPts = useMemo(() => {
    const pts = new Float32Array(4000 * 3);
    for (let i = 0; i < 4000; i++) {
      const t = i / 4000;
      const angle = t * Math.PI * 14; // Tighter spiral
      const r = (1 - t) * 3.2;
      const y = t * 7 - 1;
      // Micro-jitter for silk effect
      const jitter = 0.08;
      pts[i * 3] = Math.cos(angle) * r + (Math.random() - 0.5) * jitter;
      pts[i * 3 + 1] = y + (Math.random() - 0.5) * jitter;
      pts[i * 3 + 2] = Math.sin(angle) * r + (Math.random() - 0.5) * jitter;
    }
    return pts;
  }, []);

  useFrame((state) => {
    if (treeGroupRef.current) {
      treeGroupRef.current.rotation.y = THREE.MathUtils.lerp(treeGroupRef.current.rotation.y, rotationY, 0.05);
      const targetScale = treeState === TreeState.SCATTERED ? 1.1 : 1.0;
      treeGroupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.08);
    }
    
    if (goldSpiralRef.current) {
      goldSpiralRef.current.rotation.y += 0.002;
      const material = goldSpiralRef.current.material as THREE.PointsMaterial;
      // Strobe-like flicker for "频闪" effect
      material.opacity = 0.4 + Math.pow(Math.sin(state.clock.elapsedTime * 8), 2) * 0.6;
    }
  });

  return (
    <group ref={treeGroupRef}>
      {/* 1. Main Tree Body - Snow White Foggy Layers */}
      <Points positions={treeParticles}>
        <PointMaterial
          transparent
          vertexColors={false}
          color="#ffffff"
          size={0.06}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.35}
        />
      </Points>
      
      {/* 2. Edge Fog Layer - "边缘雾化光气层" */}
      <Points positions={outerFogParticles}>
        <PointMaterial
          transparent
          color="#e0f2fe"
          size={0.12}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.1}
        />
      </Points>

      {/* 3. Golden Spiral Silk Light Ribbons */}
      <Points ref={goldSpiralRef} positions={goldPts}>
        <PointMaterial
          transparent
          color="#ffd700"
          size={0.035}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.8}
        />
      </Points>

      {/* 4. Top Star - "银星发暖金白光，中心亮边缘虚" */}
      <group position={[0, 6.2, 0]}>
        {/* Soft edge points */}
        <Points positions={starParticles}>
          <PointMaterial
            transparent
            color="#fff9db"
            size={0.08}
            sizeAttenuation={true}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            opacity={0.4}
          />
        </Points>
        {/* Bright core */}
        <mesh>
          <sphereGeometry args={[0.15, 32, 32]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <pointLight intensity={10} color="#fff4d1" distance={10} decay={2} />
      </group>

      {/* 5. Elliptical Suspended Stage - "纯白椭圆悬浮柔光舞台" */}
      <group position={[0, -3.9, 0]}>
        {/* The Ellipse Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[1.4, 0.8, 1]}>
          <circleGeometry args={[4, 64]} />
          <meshStandardMaterial 
            color="#ffffff" 
            emissive="#ffffff" 
            emissiveIntensity={0.1} 
            transparent 
            opacity={0.25}
            metalness={0}
            roughness={1}
          />
        </mesh>
        {/* Dusty blurry edge around the ellipse */}
        <Sparkles 
          count={250} 
          scale={[7, 0.5, 4]} 
          position={[0, 0.1, 0]} 
          size={1.5} 
          speed={0.05} 
          color="#ffffff" 
          opacity={0.4}
        />
      </group>

      {/* 6. High-Luxury Props - "银白小狗+银金礼盒" */}
      <group position={[0, -3.8, 0]}>
        {/* Silver Dog */}
        <Float speed={2} rotationIntensity={0.05} floatIntensity={0.1}>
          <mesh position={[-1, 0.4, 0.8]}>
            <capsuleGeometry args={[0.25, 0.5, 8, 16]} />
            <meshStandardMaterial color="#ffffff" metalness={1} roughness={0.1} emissive="#e5e7eb" emissiveIntensity={0.2} />
          </mesh>
        </Float>
        {/* Gift Boxes */}
        <mesh position={[1.2, 0.4, -0.2]}>
          <boxGeometry args={[0.7, 0.7, 0.7]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} emissive="#ffffff" emissiveIntensity={0.1} />
        </mesh>
        <mesh position={[1.5, 0.3, 0.6]}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} emissive="#78350f" emissiveIntensity={0.1} />
        </mesh>
      </group>

      {/* 7. Ambient Soft Dust */}
      <Sparkles count={300} scale={[12, 10, 12]} size={1.5} speed={0.2} color="#ffffff" opacity={0.5} />
    </group>
  );
};

export default Tree;
