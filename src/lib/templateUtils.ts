import { MagicTemplateDSL } from '@/templates/types/magic-dsl';
import { CustomTemplateConfig } from '@/store/useResumeStore';



/**
 * 合并基础模板和用户自定义配置
 * @param baseTemplate 基础模板
 * @param customConfig 用户自定义配置
 * @returns 合并后的完整模板配置
 */
export function mergeTemplateConfig(
  baseTemplate: MagicTemplateDSL, 
  customConfig?: CustomTemplateConfig
): MagicTemplateDSL {
  if (!customConfig) {
    return baseTemplate;
  }

  // 创建副本并合并配置
  const mergedTemplate: MagicTemplateDSL = JSON.parse(JSON.stringify(baseTemplate));

  // 合并 designTokens
  if (customConfig.designTokens) {
    if (customConfig.designTokens.colors) {
      mergedTemplate.designTokens.colors = {
        ...mergedTemplate.designTokens.colors,
        ...customConfig.designTokens.colors,
      };
    }
    
    if (customConfig.designTokens.typography) {
      if (customConfig.designTokens.typography.fontFamily) {
        mergedTemplate.designTokens.typography.fontFamily = {
          ...mergedTemplate.designTokens.typography.fontFamily,
          ...customConfig.designTokens.typography.fontFamily,
        };
      }
      if (customConfig.designTokens.typography.fontSize) {
        mergedTemplate.designTokens.typography.fontSize = {
          ...mergedTemplate.designTokens.typography.fontSize,
          ...customConfig.designTokens.typography.fontSize,
        };
      }
      if (customConfig.designTokens.typography.fontWeight) {
        mergedTemplate.designTokens.typography.fontWeight = {
          ...mergedTemplate.designTokens.typography.fontWeight,
          ...customConfig.designTokens.typography.fontWeight,
        };
      }
    }

    if (customConfig.designTokens.spacing) {
      mergedTemplate.designTokens.spacing = {
        ...mergedTemplate.designTokens.spacing,
        ...customConfig.designTokens.spacing,
      };
    }

    if (customConfig.designTokens.borderRadius) {
      mergedTemplate.designTokens.borderRadius = {
        ...mergedTemplate.designTokens.borderRadius,
        ...customConfig.designTokens.borderRadius,
      };
    }
  }

  // 合并 layout
  if (customConfig.layout) {
    // 只合并定义了的属性
    if (customConfig.layout.type !== undefined) {
      mergedTemplate.layout.type = customConfig.layout.type;
    }
    if (customConfig.layout.containerWidth !== undefined) {
      mergedTemplate.layout.containerWidth = customConfig.layout.containerWidth;
    }
    if (customConfig.layout.containerHeight !== undefined) {
      mergedTemplate.layout.containerHeight = customConfig.layout.containerHeight;
    }
    if (customConfig.layout.padding !== undefined) {
      mergedTemplate.layout.padding = customConfig.layout.padding;
    }
    if (customConfig.layout.gap !== undefined) {
      mergedTemplate.layout.gap = customConfig.layout.gap;
    }

    if (customConfig.layout.twoColumn && mergedTemplate.layout.twoColumn) {
      if (customConfig.layout.twoColumn.leftWidth !== undefined) {
        mergedTemplate.layout.twoColumn.leftWidth = customConfig.layout.twoColumn.leftWidth;
      }
      if (customConfig.layout.twoColumn.rightWidth !== undefined) {
        mergedTemplate.layout.twoColumn.rightWidth = customConfig.layout.twoColumn.rightWidth;
      }
      if (customConfig.layout.twoColumn.gap !== undefined) {
        mergedTemplate.layout.twoColumn.gap = customConfig.layout.twoColumn.gap;
      }
    }

    if (customConfig.layout.sidebar && mergedTemplate.layout.sidebar) {
      if (customConfig.layout.sidebar.position !== undefined) {
        mergedTemplate.layout.sidebar.position = customConfig.layout.sidebar.position;
      }
      if (customConfig.layout.sidebar.width !== undefined) {
        mergedTemplate.layout.sidebar.width = customConfig.layout.sidebar.width;
      }
      if (customConfig.layout.sidebar.gap !== undefined) {
        mergedTemplate.layout.sidebar.gap = customConfig.layout.sidebar.gap;
      }
    }
  }

  // 如果有自定义配置，更新模板ID和名称以标识为自定义版本
  if (customConfig.designTokens || customConfig.layout) {
    mergedTemplate.id = `${baseTemplate.id}-custom`;
    mergedTemplate.name = `${baseTemplate.name} (Custom)`;
    mergedTemplate.updatedAt = new Date().toISOString();
  }

  return mergedTemplate;
}

/**
 * 从完整的模板配置中提取用户自定义的差异
 * @param baseTemplate 基础模板
 * @param fullTemplate 完整的模板配置
 * @returns 用户自定义的配置差异
 */
export function extractCustomConfig(
  baseTemplate: MagicTemplateDSL, 
  fullTemplate: MagicTemplateDSL
): CustomTemplateConfig | undefined {
  const customConfig: CustomTemplateConfig = {};
  let hasChanges = false;

  // 检查 designTokens 的差异
  if (fullTemplate.designTokens) {
    const colorDiffs = extractColorDiffs(baseTemplate.designTokens.colors, fullTemplate.designTokens.colors);
    const typographyDiffs = extractTypographyDiffs(baseTemplate.designTokens.typography, fullTemplate.designTokens.typography);
    const spacingDiffs = extractObjectDiffs(baseTemplate.designTokens.spacing, fullTemplate.designTokens.spacing);
    const borderRadiusDiffs = extractObjectDiffs(baseTemplate.designTokens.borderRadius, fullTemplate.designTokens.borderRadius);

    if (colorDiffs || typographyDiffs || spacingDiffs || borderRadiusDiffs) {
      customConfig.designTokens = {};
      if (colorDiffs) customConfig.designTokens.colors = colorDiffs;
      if (typographyDiffs) customConfig.designTokens.typography = typographyDiffs;
      if (spacingDiffs) customConfig.designTokens.spacing = spacingDiffs;
      if (borderRadiusDiffs) customConfig.designTokens.borderRadius = borderRadiusDiffs;
      hasChanges = true;
    }
  }

  // 检查 layout 的差异
  if (fullTemplate.layout) {
    const layoutDiffs = extractLayoutDiffs(baseTemplate.layout, fullTemplate.layout);
    if (layoutDiffs) {
      customConfig.layout = layoutDiffs;
      hasChanges = true;
    }
  }

  return hasChanges ? customConfig : undefined;
}

// 辅助函数：提取颜色差异
function extractColorDiffs(base: Record<string, string>, custom: Record<string, string>) {
  const diffs: Record<string, string> = {};
  let hasDiffs = false;

  for (const key in custom) {
    if (custom[key] !== base[key]) {
      diffs[key] = custom[key];
      hasDiffs = true;
    }
  }

  return hasDiffs ? diffs : undefined;
}

// 辅助函数：提取字体差异
function extractTypographyDiffs(base: Record<string, unknown>, custom: Record<string, unknown>) {
  const diffs: Record<string, unknown> = {};
  let hasDiffs = false;

  // 检查 fontFamily
  if (custom.fontFamily && typeof custom.fontFamily === 'object' && custom.fontFamily !== null) {
    const fontFamilyDiffs = extractObjectDiffs(base.fontFamily as Record<string, unknown> || {}, custom.fontFamily as Record<string, unknown>);
    if (fontFamilyDiffs) {
      diffs.fontFamily = fontFamilyDiffs;
      hasDiffs = true;
    }
  }

  // 检查 fontSize
  if (custom.fontSize && typeof custom.fontSize === 'object' && custom.fontSize !== null) {
    const fontSizeDiffs = extractObjectDiffs(base.fontSize as Record<string, unknown> || {}, custom.fontSize as Record<string, unknown>);
    if (fontSizeDiffs) {
      diffs.fontSize = fontSizeDiffs;
      hasDiffs = true;
    }
  }

  // 检查 fontWeight
  if (custom.fontWeight && typeof custom.fontWeight === 'object' && custom.fontWeight !== null) {
    const fontWeightDiffs = extractObjectDiffs(base.fontWeight as Record<string, unknown> || {}, custom.fontWeight as Record<string, unknown>);
    if (fontWeightDiffs) {
      diffs.fontWeight = fontWeightDiffs;
      hasDiffs = true;
    }
  }

  return hasDiffs ? diffs : undefined;
}

// 辅助函数：提取对象差异
function extractObjectDiffs(base: Record<string, unknown>, custom: Record<string, unknown>) {
  const diffs: Record<string, unknown> = {};
  let hasDiffs = false;

  for (const key in custom) {
    if (custom[key] !== base[key]) {
      diffs[key] = custom[key];
      hasDiffs = true;
    }
  }

  return hasDiffs ? diffs : undefined;
}

// 辅助函数：提取布局差异
function extractLayoutDiffs(base: Record<string, unknown>, custom: Record<string, unknown>) {
  const diffs: Record<string, unknown> = {};
  let hasDiffs = false;

  for (const key in custom) {
    if (typeof custom[key] === 'object' && custom[key] !== null) {
      const subDiffs = extractObjectDiffs((base[key] as Record<string, unknown>) || {}, custom[key] as Record<string, unknown>);
      if (subDiffs) {
        diffs[key] = subDiffs;
        hasDiffs = true;
      }
    } else if (custom[key] !== base[key]) {
      diffs[key] = custom[key];
      hasDiffs = true;
    }
  }

  return hasDiffs ? diffs : undefined;
} 