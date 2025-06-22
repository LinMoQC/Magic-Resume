import { MagicTemplateDSL } from '@/templates/types/magic-dsl';

interface TemplateResponse {
  templates: Record<string, MagicTemplateDSL>;
  defaultTemplate: string;
  templateList: MagicTemplateDSL[];
}

class TemplateService {
  private baseUrl = '/api/templates';
  
  // 缓存
  private cache: {
    templates?: Record<string, MagicTemplateDSL>;
    templateList?: MagicTemplateDSL[];
    defaultTemplate?: string;
  } = {};

  // 获取所有模板
  async getAllTemplates(): Promise<TemplateResponse> {
    if (this.cache.templates && this.cache.templateList && this.cache.defaultTemplate) {
      return {
        templates: this.cache.templates,
        templateList: this.cache.templateList,
        defaultTemplate: this.cache.defaultTemplate
      };
    }

    try {
      const response = await fetch(this.baseUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: TemplateResponse = await response.json();
      
      // 缓存数据
      this.cache.templates = data.templates;
      this.cache.templateList = data.templateList;
      this.cache.defaultTemplate = data.defaultTemplate;
      
      return data;
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      throw new Error('Failed to load templates');
    }
  }

  // 获取特定模板
  async getTemplateById(id: string): Promise<MagicTemplateDSL> {
    // 先尝试从缓存获取
    if (this.cache.templates && this.cache.templates[id]) {
      return this.cache.templates[id];
    }

    try {
      const response = await fetch(`${this.baseUrl}?id=${encodeURIComponent(id)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const template: MagicTemplateDSL = await response.json();
      
      // 更新缓存
      if (!this.cache.templates) {
        this.cache.templates = {};
      }
      this.cache.templates[id] = template;
      
      return template;
    } catch (error) {
      console.error(`Failed to fetch template ${id}:`, error);
      throw new Error(`Failed to load template: ${id}`);
    }
  }

  // 获取默认模板
  async getDefaultTemplate(): Promise<MagicTemplateDSL> {
    if (this.cache.defaultTemplate && this.cache.templates?.[this.cache.defaultTemplate]) {
      return this.cache.templates[this.cache.defaultTemplate];
    }

    const data = await this.getAllTemplates();
    return data.templates[data.defaultTemplate];
  }

  // 清除缓存
  clearCache(): void {
    this.cache = {};
  }

  // 预加载模板（可选）
  async preloadTemplates(): Promise<void> {
    try {
      await this.getAllTemplates();
    } catch (error) {
      console.warn('Failed to preload templates:', error);
    }
  }
}

// 导出单例
export const templateService = new TemplateService();

// 也导出类型
export type { TemplateResponse }; 