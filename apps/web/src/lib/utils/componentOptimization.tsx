import React from 'react';
import dynamic from 'next/dynamic';
import { ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * 创建优化的动态导入组件
 * 适用于大型组件或第三方库
 */
export function createOptimizedComponent<T = object>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  options: {
    ssr?: boolean;
    loading?: () => React.ReactElement;
  } = {}
) {
  return dynamic(importFn, {
    ssr: options.ssr ?? false,
    loading: options.loading,
  });
}

/**
 * AI相关组件的懒加载配置
 * 这些组件通常较大且不是首屏必需的
 */
export const AIComponents = {
  // 代码编辑器 - Monaco Editor很大
  MonacoEditor: createOptimizedComponent(
    () => import('@monaco-editor/react'),
    {
      ssr: false,
      loading: () => <div className="animate-pulse bg-gray-800 h-64 rounded" />,
    }
  ),
};

/**
 * 编辑器相关组件的懒加载
 */
export const EditorComponents = {
  // TipTap编辑器 — 骨架镜像最终布局(工具栏条 + 三行文本),同 token 同高度,
  // 加载完成零跳动;外层描边由调用方容器提供,这里不再自带 border。
  TiptapEditor: createOptimizedComponent(
    () => import('@/components/features/resume/TiptapEditor'),
    {
      ssr: false,
      loading: () => (
        <div aria-hidden className="animate-pulse">
          <div className="flex h-10 items-center gap-1.5 border-b border-white/[0.06] px-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-6 w-6 rounded-md bg-white/[0.05]" />
            ))}
            <div className="mx-1 h-4 w-px bg-white/[0.06]" />
            {[6, 7, 8].map((i) => (
              <div key={i} className="h-6 w-6 rounded-md bg-white/[0.05]" />
            ))}
          </div>
          <div className="min-h-[160px] space-y-2.5 px-4 py-4">
            <div className="h-3 w-2/5 rounded bg-white/[0.06]" />
            <div className="h-3 w-11/12 rounded bg-white/[0.04]" />
            <div className="h-3 w-4/5 rounded bg-white/[0.04]" />
            <div className="h-3 w-3/5 rounded bg-white/[0.04]" />
          </div>
        </div>
      ),
    }
  ),

  // JSON查看器
  JsonViewer: createOptimizedComponent(
    () => import('@microlink/react-json-view'),
    {
      ssr: false,
      loading: () => <div className="w-full h-full flex items-center justify-center text-white">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>,
    }
  ),
};

/**
 * 预加载关键组件
 * 在用户可能需要之前提前加载
 */
export const preloadComponents = () => {
  if (typeof window !== 'undefined') {
    // 只在dashboard或edit路由才预加载编辑器组件
    const currentPath = window.location.pathname;
    const isDashboardRoute = currentPath.startsWith('/dashboard') || currentPath.startsWith('/edit');
    
    if (isDashboardRoute) {
      // 预加载编辑器（编辑页面的核心功能）
      setTimeout(() => {
        import('@/components/features/resume/TiptapEditor');
      }, 1000);

      // 预加载Monaco编辑器
      setTimeout(() => {
        import('@monaco-editor/react');
      }, 2000);
    }
  }
};

/**
 * 组件性能监控
 */
export const measureComponentPerformance = (componentName: string) => {
  if (typeof window !== 'undefined' && window.performance) {
    return {
      start: () => {
        performance.mark(`${componentName}-start`);
      },
      end: () => {
        performance.mark(`${componentName}-end`);
        performance.measure(
          `${componentName}-duration`,
          `${componentName}-start`,
          `${componentName}-end`
        );
        
        const measure = performance.getEntriesByName(`${componentName}-duration`)[0];
        console.log(`${componentName} rendered in ${measure.duration.toFixed(2)}ms`);
      },
    };
  }
  return { start: () => {}, end: () => {} };
}; 