"use client";

import { useEffect } from 'react';
import { preloadComponents, measureComponentPerformance } from '@/lib/utils/componentOptimization';
import { usePathname } from 'next/navigation';

export default function PreloadOptimizer() {
  const pathname = usePathname();

  useEffect(() => {
    // 性能监控
    const perf = measureComponentPerformance('App-Initialization');
    perf.start();

    // 根据路由决定是否预加载
    const isDashboardRoute = pathname?.startsWith('/dashboard') || pathname?.startsWith('/edit');
    
    if (isDashboardRoute) {
      // 只在dashboard相关页面预加载编辑器组件
      preloadComponents();
    }

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
  }, [pathname]);

  // 这个组件不渲染任何内容，只负责后台优化
  return null;
} 