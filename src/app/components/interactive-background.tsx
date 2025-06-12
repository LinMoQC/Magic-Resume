"use client";

import * as THREE from 'three';
import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';

function Stars(props: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const { count = 5000 } = props;

  const positions = useMemo(() => {
    let positions = [];
    for (let i = 0; i < count; i++) {
      positions.push((Math.random() - 0.5) * 10);
      positions.push((Math.random() - 0.5) * 10);
      positions.push((Math.random() - 0.5) * 10);
    }
    return new Float32Array(positions);
  }, [count]);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={positions} stride={3} frustumCulled={false} {...props}>
        <PointMaterial
          transparent
          color="#67e8f9"
          size={0.015}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
}

function CameraRig() {
  useFrame((state, delta) => {
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, state.mouse.x / 2, 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, -state.mouse.y / 2, 0.05);
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

export function InteractiveBackground() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <Stars />
        <CameraRig />
      </Canvas>
    </div>
  );
} 