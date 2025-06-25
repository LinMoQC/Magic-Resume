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
  // TipTap编辑器
  TiptapEditor: createOptimizedComponent(
    () => import('@/app/components/TiptapEditor'),
    {
      ssr: false,
      loading: () => <div className="animate-pulse bg-gray-100 h-32 rounded border" />,
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
    // 预加载编辑器（编辑页面的核心功能）
    setTimeout(() => {
      import('@/app/components/TiptapEditor');
    }, 1000);

    // 预加载Monaco编辑器
    setTimeout(() => {
      import('@monaco-editor/react');
    }, 2000);
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