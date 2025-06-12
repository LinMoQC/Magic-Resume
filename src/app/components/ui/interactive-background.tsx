import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

function Stars(props: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const { count = 5000 } = props;

  const positions = useMemo(() => {
    const positions = [];
    for (let i = 0; i < count; i++) {
      positions.push((Math.random() - 0.5) * 10);
      positions.push((Math.random() - 0.5) * 10);
      positions.push((Math.random() - 0.5) * 10);
    }
    return new Float32Array(positions);
  }, [count]);

  useFrame((state) => {
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, state.mouse.x / 2, 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, -state.mouse.y / 2, 0.05);
  });

  return (
    <points ref={ref}>
      <bufferGeometry attach="geometry">
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <meshBasicMaterial color="white" />
    </points>
  );
}

function CameraRig() {
  useFrame((state) => {
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, state.mouse.x / 2, 0.05);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, -state.mouse.y / 2, 0.05);
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

export function InteractiveBackground() {
  return (
    <group>
      <Stars count={5000} />
      <CameraRig />
    </group>
  );
} 