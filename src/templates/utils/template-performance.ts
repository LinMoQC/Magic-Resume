import { MagicTemplateDSL } from '../types/magic-dsl';
import { Resume } from '@/store/useResumeStore';

// 模板缓存管理
class TemplateCache {
  private cache = new Map<string, {
    template: MagicTemplateDSL;
    timestamp: number;
    renderTime: number;
  }>();
  private maxSize = 50; // 最大缓存数量
  private ttl = 5 * 60 * 1000; // 5分钟缓存时间

  set(key: string, template: MagicTemplateDSL, renderTime: number = 0) {
    // 如果缓存已满，删除最旧的条目
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      template,
      timestamp: Date.now(),
      renderTime
    });
  }

  get(key: string): MagicTemplateDSL | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // 检查是否过期
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.template;
  }

  clear() {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.calculateHitRate()
    };
  }

  private calculateHitRate(): number {
    // 这里可以实现更复杂的命中率计算
    return this.cache.size / this.maxSize;
  }
}

// 模板渲染性能监控
class TemplatePerformanceMonitor {
  private metrics = new Map<string, {
    renderCount: number;
    totalRenderTime: number;
    averageRenderTime: number;
    lastRenderTime: number;
  }>();

  startRender(templateId: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      this.recordRender(templateId, renderTime);
    };
  }

  private recordRender(templateId: string, renderTime: number) {
    const existing = this.metrics.get(templateId) || {
      renderCount: 0,
      totalRenderTime: 0,
      averageRenderTime: 0,
      lastRenderTime: 0
    };

    const updated = {
      renderCount: existing.renderCount + 1,
      totalRenderTime: existing.totalRenderTime + renderTime,
      averageRenderTime: (existing.totalRenderTime + renderTime) / (existing.renderCount + 1),
      lastRenderTime: renderTime
    };

    this.metrics.set(templateId, updated);
  }

  getMetrics(templateId?: string) {
    if (templateId) {
      return this.metrics.get(templateId);
    }
    return Object.fromEntries(this.metrics);
  }

  getSlowestTemplates(limit: number = 5) {
    return Array.from(this.metrics.entries())
      .sort(([, a], [, b]) => b.averageRenderTime - a.averageRenderTime)
      .slice(0, limit);
  }
}

// 模板懒加载管理器
class TemplateLazyLoader {
  private loadedTemplates = new Set<string>();
  private loadingPromises = new Map<string, Promise<MagicTemplateDSL>>();

  async loadTemplate(templateId: string): Promise<MagicTemplateDSL> {
    // 如果已经加载，直接返回
    if (this.loadedTemplates.has(templateId)) {
      return this.getTemplate(templateId);
    }

    // 如果正在加载，等待加载完成
    if (this.loadingPromises.has(templateId)) {
      return this.loadingPromises.get(templateId)!;
    }

    // 开始加载
    const loadPromise = this.loadTemplateAsync(templateId);
    this.loadingPromises.set(templateId, loadPromise);

    try {
      const template = await loadPromise;
      this.loadedTemplates.add(templateId);
      this.loadingPromises.delete(templateId);
      return template;
    } catch (error) {
      this.loadingPromises.delete(templateId);
      throw error;
    }
  }

  private async loadTemplateAsync(templateId: string): Promise<MagicTemplateDSL> {
    // 模拟异步加载
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 这里应该从实际的模板注册表加载
    const { TEMPLATE_REGISTRY } = await import('../config/template-registry');
    const template = TEMPLATE_REGISTRY[templateId];
    
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }
    
    return template;
  }

  private async getTemplate(templateId: string): Promise<MagicTemplateDSL> {
    // 这里应该从实际的模板注册表获取
    const { TEMPLATE_REGISTRY } = await import('../config/template-registry');
    return TEMPLATE_REGISTRY[templateId];
  }

  preloadTemplates(templateIds: string[]) {
    templateIds.forEach(id => {
      if (!this.loadedTemplates.has(id) && !this.loadingPromises.has(id)) {
        this.loadTemplate(id).catch(console.error);
      }
    });
  }

  isLoaded(templateId: string): boolean {
    return this.loadedTemplates.has(templateId);
  }

  isLoading(templateId: string): boolean {
    return this.loadingPromises.has(templateId);
  }
}

// 模板渲染优化器
class TemplateRenderOptimizer {
  private cache = new TemplateCache();
  private monitor = new TemplatePerformanceMonitor();
  private lazyLoader = new TemplateLazyLoader();

  // 优化的模板渲染函数
  async renderTemplate(templateId: string, data: Resume): Promise<{
    template: MagicTemplateDSL;
    renderTime: number;
    isCached: boolean;
  }> {
    const stopRender = this.monitor.startRender(templateId);
    let isCached = false;

    try {
      // 尝试从缓存获取
      let template = this.cache.get(templateId);
      
      if (!template) {
        // 懒加载模板
        template = await this.lazyLoader.loadTemplate(templateId);
        isCached = false;
      } else {
        isCached = true;
      }

      // 应用自定义配置
      const finalTemplate = this.applyCustomConfig(template, data);

      const renderTime = performance.now();
      stopRender();

      // 缓存模板（不缓存自定义配置）
      if (!isCached) {
        this.cache.set(templateId, template, renderTime);
      }

      return {
        template: finalTemplate,
        renderTime,
        isCached
      };
    } catch (error) {
      stopRender();
      throw error;
    }
  }

  private applyCustomConfig(template: MagicTemplateDSL, data: Resume): MagicTemplateDSL {
    if (!data.customTemplate) {
      return template;
    }

    // 深度合并自定义配置
    const mergedTemplate = { ...template };
    
    if (data.customTemplate.designTokens) {
      if (data.customTemplate.designTokens.colors) {
        mergedTemplate.designTokens.colors = {
          ...mergedTemplate.designTokens.colors,
          ...data.customTemplate.designTokens.colors
        };
      }
      
      if (data.customTemplate.designTokens.typography) {
        if (data.customTemplate.designTokens.typography.fontFamily) {
          mergedTemplate.designTokens.typography.fontFamily = {
            ...mergedTemplate.designTokens.typography.fontFamily,
            ...data.customTemplate.designTokens.typography.fontFamily
          };
        }
      }
    }
    
    if (data.customTemplate.layout) {
      mergedTemplate.layout = {
        ...mergedTemplate.layout,
        ...data.customTemplate.layout
      } as MagicTemplateDSL['layout'];
    }

    return mergedTemplate;
  }

  // 预加载热门模板
  preloadPopularTemplates() {
    const popularTemplateIds = ['classic', 'azurill', 'bronzor'];
    this.lazyLoader.preloadTemplates(popularTemplateIds);
  }

  // 获取性能统计
  getPerformanceStats() {
    return {
      cache: this.cache.getStats(),
      metrics: this.monitor.getMetrics(),
      slowestTemplates: this.monitor.getSlowestTemplates()
    };
  }

  // 清理缓存
  clearCache() {
    this.cache.clear();
  }

  // 优化建议
  getOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    const stats = this.getPerformanceStats();
    const slowestTemplates = stats.slowestTemplates;

    if (slowestTemplates.length > 0) {
      const slowest = slowestTemplates[0];
      if (slowest[1].averageRenderTime > 100) {
        suggestions.push(`Template "${slowest[0]}" is slow (${slowest[1].averageRenderTime.toFixed(2)}ms). Consider optimizing its components.`);
      }
    }

    if (stats.cache.hitRate < 0.3) {
      suggestions.push('Cache hit rate is low. Consider preloading more templates.');
    }

    return suggestions;
  }
}

// 导出单例实例
export const templateOptimizer = new TemplateRenderOptimizer();

// 导出工具函数
export function useTemplateOptimization() {
  return {
    renderTemplate: templateOptimizer.renderTemplate.bind(templateOptimizer),
    preloadTemplates: templateOptimizer.preloadPopularTemplates.bind(templateOptimizer),
    getStats: templateOptimizer.getPerformanceStats.bind(templateOptimizer),
    getSuggestions: templateOptimizer.getOptimizationSuggestions.bind(templateOptimizer),
    clearCache: templateOptimizer.clearCache.bind(templateOptimizer)
  };
}