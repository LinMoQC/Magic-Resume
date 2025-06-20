"use client";

import { useEffect } from 'react';
import { preloadComponents, measureComponentPerformance } from '@/lib/componentOptimization';

export default function PreloadOptimizer() {
  useEffect(() => {
    // 应用启动时预加载关键组件
    preloadComponents();

    // 性能监控
    const perf = measureComponentPerformance('App-Initialization');
    perf.start();

    // 在DOM完全加载后结束监控
    const handleLoad = () => {
      perf.end();
      
      // 报告首次加载性能
      if (window.performance && window.performance.navigation) {
        const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
        console.log(`[Magic-Resume] 应用加载耗时: ${loadTime}ms`);
      }
    };

    // 如果页面已经加载完成
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
    }

    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  // 这个组件不渲染任何内容，只负责后台优化
  return null;
} 