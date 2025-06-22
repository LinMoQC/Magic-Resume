"use client";

import * as THREE from 'three';
import { useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial, Sphere } from '@react-three/drei';

// 性能检测
const getDevicePerformance = () => {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) return 'low';
  
  try {
    const webglContext = gl as WebGLRenderingContext;
    const renderer = webglContext.getParameter(webglContext.RENDERER);
    const vendor = webglContext.getParameter(webglContext.VENDOR);
    
    // 简单的GPU检测
    if (renderer && (renderer.includes('Intel') || renderer.includes('Mali'))) {
      return 'low';
    }
    return 'high';
  } catch {
    return 'low';
  }
};

// 优化版星空组件
function OptimizedStars(props: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const performance = useMemo(() => getDevicePerformance(), []);
  const { count = performance === 'high' ? 3000 : 1500 } = props;

  const [positions, colors] = useMemo(() => {
    const positions = [];
    const colors = [];
    
    for (let i = 0; i < count; i++) {
      // 位置
      positions.push((Math.random() - 0.5) * 12);
      positions.push((Math.random() - 0.5) * 12);
      positions.push((Math.random() - 0.5) * 12);
      
      // 简化颜色变化
      const colorVariant = Math.random();
      if (colorVariant < 0.4) {
        colors.push(0.4, 0.9, 1); // 青色
      } else if (colorVariant < 0.7) {
        colors.push(0.7, 0.5, 1); // 紫色
      } else {
        colors.push(1, 1, 1); // 白色
      }
    }
    
    return [
      new Float32Array(positions),
      new Float32Array(colors)
    ];
  }, [count]);

  useFrame((state, delta) => {
    if (ref.current) {
      // 简化旋转计算
      ref.current.rotation.x -= delta * 0.03;
      ref.current.rotation.y -= delta * 0.02;
      
      // 简化呼吸效果
      const material = ref.current.material as THREE.PointsMaterial;
      material.opacity = 0.6 + Math.sin(state.clock.getElapsedTime()) * 0.1;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 6]}>
      <Points ref={ref} positions={positions} stride={3} frustumCulled={false} {...props}>
        <pointsMaterial
          transparent
          vertexColors
          size={0.015}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  );
}

// 简化的浮动几何体
function SimpleFloatingGeometry() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.1;
      meshRef.current.rotation.y += delta * 0.15;
      meshRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.05;
    }
  });

  return (
    <mesh ref={meshRef} position={[2.5, 0, -3]}>
      <boxGeometry args={[0.2, 0.2, 0.2]} />
      <meshBasicMaterial 
        color="#67e8f9" 
        transparent 
        opacity={0.08}
        wireframe
      />
    </mesh>
  );
}

// 简化的相机控制
function LightCameraRig() {
  const { camera } = useThree();
  
  useFrame((state) => {
    // 减少计算频率
    if (state.clock.getElapsedTime() % 0.1 < 0.016) {
      camera.position.x = THREE.MathUtils.lerp(
        camera.position.x, 
        state.mouse.x * 0.2, 
        0.02
      );
      camera.position.y = THREE.MathUtils.lerp(
        camera.position.y, 
        -state.mouse.y * 0.2, 
        0.02
      );
    }
    
    camera.lookAt(0, 0, 0);
  });
  
  return null;
}

// 简化的光晕效果
function SimplifiedGlow() {
  const orbRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (orbRef.current) {
      const time = state.clock.getElapsedTime();
      orbRef.current.position.x = Math.sin(time * 0.2) * 2;
      orbRef.current.position.y = Math.cos(time * 0.15) * 1.5;
      const material = orbRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.05 + Math.sin(time) * 0.02;
    }
  });

  return (
    <Sphere
      ref={orbRef}
      args={[0.3, 16, 16]}
      position={[0, 0, -4]}
    >
      <meshBasicMaterial
        color="#a855f7"
        transparent
        opacity={0.05}
      />
    </Sphere>
  );
}

export function InteractiveBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* 简化CSS渐变 */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/5 via-transparent to-cyan-900/5" />
      
      <Canvas 
        camera={{ position: [0, 0, 1], fov: 60 }}
        dpr={[1, 1.5]} // 限制设备像素比
        performance={{ min: 0.5 }}
        frameloop="demand" // 按需渲染
      >
        {/* 简化的组件 */}
        <OptimizedStars />
        <SimpleFloatingGeometry />
        <SimplifiedGlow />
        <LightCameraRig />
        
        {/* 减少雾效果 */}
        <fog attach="fog" args={['#000000', 8, 12]} />
      </Canvas>
      
      {/* 简化CSS光晕 */}
      <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-purple-500/3 rounded-full blur-3xl" />
    </div>
  );
} 