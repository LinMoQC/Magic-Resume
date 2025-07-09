import { MagicTemplateDSL } from '../types/magic-dsl';

// 模板质量检查结果
export interface QualityCheckResult {
  templateId: string;
  score: number; // 0-100
  issues: QualityIssue[];
  warnings: QualityWarning[];
  suggestions: string[];
  passed: boolean;
}

export interface QualityIssue {
  type: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  location?: string;
  suggestion?: string;
}

export interface QualityWarning {
  type: 'performance' | 'accessibility' | 'best_practice';
  message: string;
  impact: 'high' | 'medium' | 'low';
}

// 模板质量检查器
export class TemplateQualityChecker {
  private rules: QualityRule[] = [];

  constructor() {
    this.initializeRules();
  }

  private initializeRules() {
    this.rules = [
      // 必需字段检查
      {
        name: 'required-fields',
        check: (template: MagicTemplateDSL): QualityIssue[] => {
          const issues: QualityIssue[] = [];
          
          if (!template.id) {
            issues.push({
              type: 'error',
              code: 'MISSING_ID',
              message: 'Template ID is required',
              severity: 'high'
            });
          }
          
          if (!template.name) {
            issues.push({
              type: 'error',
              code: 'MISSING_NAME',
              message: 'Template name is required',
              severity: 'high'
            });
          }
          
          if (!template.description) {
            issues.push({
              type: 'warning',
              code: 'MISSING_DESCRIPTION',
              message: 'Template description is recommended',
              severity: 'medium'
            });
          }
          
          return issues;
        }
      },
      
      // 设计令牌检查
      {
        name: 'design-tokens',
        check: (template: MagicTemplateDSL): QualityIssue[] => {
          const issues: QualityIssue[] = [];
          const { designTokens } = template;
          
          // 检查必需的颜色
          const requiredColors = ['primary', 'secondary', 'text', 'textSecondary', 'background', 'border'];
          requiredColors.forEach(color => {
            if (!designTokens.colors[color as keyof typeof designTokens.colors]) {
              issues.push({
                type: 'error',
                code: `MISSING_COLOR_${color.toUpperCase()}`,
                message: `Required color '${color}' is missing`,
                severity: 'high',
                location: `designTokens.colors.${color}`
              });
            }
          });
          
          // 检查字体配置
          if (!designTokens.typography.fontFamily.primary) {
            issues.push({
              type: 'error',
              code: 'MISSING_PRIMARY_FONT',
              message: 'Primary font family is required',
              severity: 'high',
              location: 'designTokens.typography.fontFamily.primary'
            });
          }
          
          // 检查字体大小配置
          const requiredFontSizes = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
          requiredFontSizes.forEach(size => {
            if (!designTokens.typography.fontSize[size as keyof typeof designTokens.typography.fontSize]) {
              issues.push({
                type: 'error',
                code: `MISSING_FONT_SIZE_${size.toUpperCase()}`,
                message: `Required font size '${size}' is missing`,
                severity: 'high',
                location: `designTokens.typography.fontSize.${size}`
              });
            }
          });
          
          return issues;
        }
      },
      
      // 布局检查
      {
        name: 'layout',
        check: (template: MagicTemplateDSL): QualityIssue[] => {
          const issues: QualityIssue[] = [];
          const { layout } = template;
          
          if (!layout.type) {
            issues.push({
              type: 'error',
              code: 'MISSING_LAYOUT_TYPE',
              message: 'Layout type is required',
              severity: 'high',
              location: 'layout.type'
            });
          }
          
          if (!layout.containerWidth) {
            issues.push({
              type: 'error',
              code: 'MISSING_CONTAINER_WIDTH',
              message: 'Container width is required',
              severity: 'high',
              location: 'layout.containerWidth'
            });
          }
          
          // 检查两栏布局配置
          if (layout.type === 'two-column' && !layout.twoColumn) {
            issues.push({
              type: 'error',
              code: 'MISSING_TWO_COLUMN_CONFIG',
              message: 'Two-column layout requires twoColumn configuration',
              severity: 'high',
              location: 'layout.twoColumn'
            });
          }
          
          return issues;
        }
      },
      
      // 组件检查
      {
        name: 'components',
        check: (template: MagicTemplateDSL): QualityIssue[] => {
          const issues: QualityIssue[] = [];
          const { components } = template;
          
          if (!components || components.length === 0) {
            issues.push({
              type: 'error',
              code: 'NO_COMPONENTS',
              message: 'Template must have at least one component',
              severity: 'high'
            });
            return issues;
          }
          
          // 检查组件ID唯一性
          const componentIds = components.map(c => c.id);
          const duplicateIds = componentIds.filter((id, index) => componentIds.indexOf(id) !== index);
          
          if (duplicateIds.length > 0) {
            issues.push({
              type: 'error',
              code: 'DUPLICATE_COMPONENT_IDS',
              message: `Duplicate component IDs found: ${duplicateIds.join(', ')}`,
              severity: 'high'
            });
          }
          
          // 检查必需组件
          const hasHeader = components.some(c => c.dataBinding === 'info');
          if (!hasHeader) {
            issues.push({
              type: 'warning',
              code: 'NO_HEADER_COMPONENT',
              message: 'No header component found (dataBinding: "info")',
              severity: 'medium',
              suggestion: 'Add a Header component with dataBinding: "info"'
            });
          }
          
          // 检查组件类型
          components.forEach((component, index) => {
            if (!component.type) {
              issues.push({
                type: 'error',
                code: 'MISSING_COMPONENT_TYPE',
                message: `Component at index ${index} is missing type`,
                severity: 'high',
                location: `components[${index}].type`
              });
            }
            
            if (!component.dataBinding) {
              issues.push({
                type: 'error',
                code: 'MISSING_DATA_BINDING',
                message: `Component at index ${index} is missing dataBinding`,
                severity: 'high',
                location: `components[${index}].dataBinding`
              });
            }
          });
          
          return issues;
        }
      },
      
      // 性能检查
      {
        name: 'performance',
        check: (template: MagicTemplateDSL): QualityIssue[] => {
          const issues: QualityIssue[] = [];
          const { components } = template;
          
          // 检查组件数量
          if (components.length > 20) {
            issues.push({
              type: 'warning',
              code: 'TOO_MANY_COMPONENTS',
              message: `Template has ${components.length} components, consider reducing for better performance`,
              severity: 'medium',
              suggestion: 'Consider combining similar components or removing unnecessary ones'
            });
          }
          
          // 检查复杂布局
          if (template.layout.type === 'two-column' && components.length > 15) {
            issues.push({
              type: 'warning',
              code: 'COMPLEX_TWO_COLUMN',
              message: 'Two-column layout with many components may impact performance',
              severity: 'low',
              suggestion: 'Consider using single-column layout or reducing component count'
            });
          }
          
          return issues;
        }
      },
      
      // 可访问性检查
      {
        name: 'accessibility',
        check: (template: MagicTemplateDSL): QualityIssue[] => {
          const issues: QualityIssue[] = [];
          
          // 检查颜色对比度
          const { colors } = template.designTokens;
          if (colors.text && colors.background) {
            const contrastRatio = this.calculateContrastRatio(colors.text, colors.background);
            if (contrastRatio < 4.5) {
              issues.push({
                type: 'warning',
                code: 'LOW_CONTRAST_RATIO',
                message: `Text contrast ratio (${contrastRatio.toFixed(2)}) is below WCAG AA standard (4.5)`,
                severity: 'medium',
                suggestion: 'Consider using darker text or lighter background for better readability'
              });
            }
          }
          
          return issues;
        }
      }
    ];
  }

  // 检查模板质量
  checkTemplate(template: MagicTemplateDSL): QualityCheckResult {
    const issues: QualityIssue[] = [];
    const warnings: QualityWarning[] = [];
    
    // 运行所有规则
    this.rules.forEach(rule => {
      const ruleIssues = rule.check(template);
      issues.push(...ruleIssues);
    });
    
    // 生成警告
    warnings.push(...this.generateWarnings(template));
    
    // 计算分数
    const score = this.calculateScore(issues, warnings);
    
    // 生成建议
    const suggestions = this.generateSuggestions(issues, warnings);
    
    return {
      templateId: template.id,
      score,
      issues,
      warnings,
      suggestions,
      passed: score >= 80 // 80分以上为通过
    };
  }

  // 批量检查模板
  checkTemplates(templates: MagicTemplateDSL[]): QualityCheckResult[] {
    return templates.map(template => this.checkTemplate(template));
  }

  // 计算质量分数
  private calculateScore(issues: QualityIssue[], warnings: QualityWarning[]): number {
    let score = 100;
    
    // 根据问题严重程度扣分
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'high':
          score -= 20;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });
    
    // 根据警告影响扣分
    warnings.forEach(warning => {
      switch (warning.impact) {
        case 'high':
          score -= 5;
          break;
        case 'medium':
          score -= 3;
          break;
        case 'low':
          score -= 1;
          break;
      }
    });
    
    return Math.max(0, score);
  }

  // 生成警告
  private generateWarnings(template: MagicTemplateDSL): QualityWarning[] {
    const warnings: QualityWarning[] = [];
    
    // 性能警告
    if (template.components.length > 15) {
      warnings.push({
        type: 'performance',
        message: 'Template has many components which may impact rendering performance',
        impact: 'medium'
      });
    }
    
    // 最佳实践警告
    if (!template.description) {
      warnings.push({
        type: 'best_practice',
        message: 'Template description helps users understand its purpose',
        impact: 'low'
      });
    }
    
    // 可访问性警告
    if (template.designTokens.colors.text && template.designTokens.colors.background) {
      const contrastRatio = this.calculateContrastRatio(
        template.designTokens.colors.text,
        template.designTokens.colors.background
      );
      
      if (contrastRatio < 7) {
        warnings.push({
          type: 'accessibility',
          message: 'Text contrast could be improved for better accessibility',
          impact: 'medium'
        });
      }
    }
    
    return warnings;
  }

  // 生成建议
  private generateSuggestions(issues: QualityIssue[], warnings: QualityWarning[]): string[] {
    const suggestions: string[] = [];
    
    // 基于问题生成建议
    issues.forEach(issue => {
      if (issue.suggestion) {
        suggestions.push(issue.suggestion);
      }
    });
    
    // 基于警告生成建议
    warnings.forEach(warning => {
      switch (warning.type) {
        case 'performance':
          suggestions.push('Consider optimizing component structure for better performance');
          break;
        case 'accessibility':
          suggestions.push('Review color contrast and ensure keyboard navigation support');
          break;
        case 'best_practice':
          suggestions.push('Follow template design best practices for consistency');
          break;
      }
    });
    
    return [...new Set(suggestions)]; // 去重
  }

  // 计算颜色对比度
  private calculateContrastRatio(color1: string, color2: string): number {
    // 简化的对比度计算
    // 实际实现应该使用更复杂的算法
    const luminance1 = this.getLuminance(color1);
    const luminance2 = this.getLuminance(color2);
    
    const lighter = Math.max(luminance1, luminance2);
    const darker = Math.min(luminance1, luminance2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  // 获取颜色亮度
  private getLuminance(color: string): number {
    // 简化的亮度计算
    // 实际实现应该将颜色转换为RGB并计算相对亮度
    return 0.5; // 占位符值
  }

  // 获取检查报告
  getReport(templates: MagicTemplateDSL[]): {
    summary: {
      total: number;
      passed: number;
      failed: number;
      averageScore: number;
    };
    results: QualityCheckResult[];
    commonIssues: Array<{
      code: string;
      count: number;
      message: string;
    }>;
  } {
    const results = this.checkTemplates(templates);
    const passed = results.filter(r => r.passed).length;
    const failed = results.length - passed;
    const averageScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    
    // 统计常见问题
    const issueCounts = new Map<string, { count: number; message: string }>();
    results.forEach(result => {
      result.issues.forEach(issue => {
        const existing = issueCounts.get(issue.code);
        if (existing) {
          existing.count++;
        } else {
          issueCounts.set(issue.code, { count: 1, message: issue.message });
        }
      });
    });
    
    const commonIssues = Array.from(issueCounts.entries())
      .map(([code, { count, message }]) => ({ code, count, message }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    return {
      summary: {
        total: templates.length,
        passed,
        failed,
        averageScore: Math.round(averageScore * 100) / 100
      },
      results,
      commonIssues
    };
  }
}

// 质量规则接口
interface QualityRule {
  name: string;
  check: (template: MagicTemplateDSL) => QualityIssue[];
}

// 导出单例实例
export const templateQualityChecker = new TemplateQualityChecker();