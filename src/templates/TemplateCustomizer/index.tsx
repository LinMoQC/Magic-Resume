import React, { useState, useCallback } from 'react';
import { Palette, Type, Layout } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MagicTemplateDSL } from '../types/magic-dsl';
import ColorPicker from './ColorPicker';
import FontSelector from './FontSelector';

interface TemplateCustomizerProps {
  template: MagicTemplateDSL;
  onTemplateChange: (template: MagicTemplateDSL) => void;
  onBack?: () => void; // 新增：返回回调
}

export default function TemplateCustomizer({ 
  template, 
  onTemplateChange,
  onBack
}: TemplateCustomizerProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'layout'>('colors');

  // 更新颜色配置
  const updateColors = useCallback((colorUpdates: Partial<typeof template.designTokens.colors>) => {
    const updatedTemplate = {
      ...template,
      designTokens: {
        ...template.designTokens,
        colors: {
          ...template.designTokens.colors,
          ...colorUpdates,
        },
      },
    };
    onTemplateChange(updatedTemplate);
  }, [template, onTemplateChange]);

  // 更新字体配置
  const updateTypography = useCallback((typographyUpdates: Partial<typeof template.designTokens.typography>) => {
    const updatedTemplate = {
      ...template,
      designTokens: {
        ...template.designTokens,
        typography: {
          ...template.designTokens.typography,
          ...typographyUpdates,
        },
      },
    };
    onTemplateChange(updatedTemplate);
  }, [template, onTemplateChange]);

  // 更新布局配置
  const updateLayout = useCallback((layoutUpdates: Partial<typeof template.layout>) => {
    const updatedTemplate = {
      ...template,
      layout: {
        ...template.layout,
        ...layoutUpdates,
      },
    };
    onTemplateChange(updatedTemplate);
  }, [template, onTemplateChange]);

  // 应用预设主题
  const applyColorTheme = useCallback((theme: 'blue' | 'green' | 'purple' | 'orange' | 'red') => {
    const themes = {
      blue: {
        primary: '#3B82F6',
        secondary: '#1E40AF',
        accent: '#60A5FA',
      },
      green: {
        primary: '#10B981',
        secondary: '#047857',
        accent: '#34D399',
      },
      purple: {
        primary: '#8B5CF6',
        secondary: '#7C3AED',
        accent: '#A78BFA',
      },
      orange: {
        primary: '#F97316',
        secondary: '#EA580C',
        accent: '#FB923C',
      },
      red: {
        primary: '#EF4444',
        secondary: '#DC2626',
        accent: '#F87171',
      },
    };

    updateColors(themes[theme]);
  }, [updateColors]);

  const tabs = [
    { id: 'colors', label: t('templateCustomizer.tabs.colors'), icon: Palette },
    { id: 'typography', label: t('templateCustomizer.tabs.typography'), icon: Type },
    { id: 'layout', label: t('templateCustomizer.tabs.layout'), icon: Layout },
  ] as const;

  return (
    <div className="h-full flex flex-col bg-neutral-900">
      {/* 标签页导航 */}
      <div className="border-b border-neutral-800">
        <div className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
        {activeTab === 'colors' && (
          <div className="space-y-6">
            {/* 快速主题 */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-neutral-200">{t('templateCustomizer.colors.quickThemes')}</h3>
              <div className="grid grid-cols-5 gap-2">
                {(['blue', 'green', 'purple', 'orange', 'red'] as const).map((theme) => (
                  <button
                    key={theme}
                    onClick={() => applyColorTheme(theme)}
                    className="aspect-square rounded-lg border-2 border-neutral-600 hover:border-neutral-400 transition-colors duration-200"
                    style={{
                      background: `linear-gradient(135deg, ${
                        theme === 'blue' ? '#3B82F6' :
                        theme === 'green' ? '#10B981' :
                        theme === 'purple' ? '#8B5CF6' :
                        theme === 'orange' ? '#F97316' :
                        '#EF4444'
                      }, ${
                        theme === 'blue' ? '#1E40AF' :
                        theme === 'green' ? '#047857' :
                        theme === 'purple' ? '#7C3AED' :
                        theme === 'orange' ? '#EA580C' :
                        '#DC2626'
                      })`
                    }}
                    title={`${theme} 主题`}
                  />
                ))}
              </div>
            </div>

            {/* 自定义颜色 */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-neutral-200">{t('templateCustomizer.colors.customColors')}</h3>
              
              <ColorPicker
                label={t('templateCustomizer.colors.primary')}
                value={template.designTokens.colors.primary}
                onChange={(color) => updateColors({ primary: color })}
              />
              
              <ColorPicker
                label={t('templateCustomizer.colors.secondary')}
                value={template.designTokens.colors.secondary}
                onChange={(color) => updateColors({ secondary: color })}
              />
              
              <ColorPicker
                label={t('templateCustomizer.colors.text')}
                value={template.designTokens.colors.text}
                onChange={(color) => updateColors({ text: color })}
              />
              
              <ColorPicker
                label={t('templateCustomizer.colors.textSecondary')}
                value={template.designTokens.colors.textSecondary}
                onChange={(color) => updateColors({ textSecondary: color })}
              />
              
              <ColorPicker
                label={t('templateCustomizer.colors.background')}
                value={template.designTokens.colors.background}
                onChange={(color) => updateColors({ background: color })}
              />
              
              {template.designTokens.colors.sidebar && (
                <ColorPicker
                  label={t('templateCustomizer.colors.sidebar')}
                  value={template.designTokens.colors.sidebar}
                  onChange={(color) => updateColors({ sidebar: color })}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === 'typography' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <FontSelector
                label={t('templateCustomizer.typography.primaryFont')}
                value={template.designTokens.typography.fontFamily.primary}
                onChange={(font) => updateTypography({
                  fontFamily: {
                    ...template.designTokens.typography.fontFamily,
                    primary: font,
                  }
                })}
              />
              
              {template.designTokens.typography.fontFamily.secondary && (
                <FontSelector
                  label={t('templateCustomizer.typography.secondaryFont')}
                  value={template.designTokens.typography.fontFamily.secondary}
                  onChange={(font) => updateTypography({
                    fontFamily: {
                      ...template.designTokens.typography.fontFamily,
                      secondary: font,
                    }
                  })}
                />
              )}
            </div>

            {/* 字体大小调整 */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-neutral-300">{t('templateCustomizer.typography.fontSize')}</h4>
              <div className="space-y-4">
                {Object.entries(template.designTokens.typography.fontSize).map(([size, value]) => (
                  <div key={size} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-neutral-400 capitalize font-medium">{size}</label>
                      <span className="text-sm text-neutral-300 font-mono bg-neutral-800 px-2 py-1 rounded">{value}</span>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min="8"
                        max="48"
                        step="1"
                        value={parseInt(value)}
                        onChange={(e) => updateTypography({
                          fontSize: {
                            ...template.designTokens.typography.fontSize,
                            [size]: `${e.target.value}px`,
                          }
                        })}
                        className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'layout' && (
          <div className="space-y-6">
            {/* 容器设置 */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-neutral-300">{t('templateCustomizer.layout.containerSettings')}</h4>
              
              {/* 容器宽度 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-neutral-400 font-medium">{t('templateCustomizer.layout.containerWidth')}</label>
                  <span className="text-sm text-neutral-300 font-mono bg-neutral-800 px-2 py-1 rounded">
                    {template.layout.containerWidth}
                  </span>
                </div>
                <input
                  type="range"
                  min="600"
                  max="1000"
                  step="10"
                  value={parseInt(template.layout.containerWidth)}
                  onChange={(e) => updateLayout({ containerWidth: `${e.target.value}px` })}
                  className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {/* 内边距 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-neutral-400 font-medium">{t('templateCustomizer.layout.padding')}</label>
                  <span className="text-sm text-neutral-300 font-mono bg-neutral-800 px-2 py-1 rounded">
                    {template.layout.padding}
                  </span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="48"
                  step="4"
                  value={parseInt(template.layout.padding)}
                  onChange={(e) => updateLayout({ padding: `${e.target.value}px` })}
                  className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {/* 组件间距 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-neutral-400 font-medium">{t('templateCustomizer.layout.gap')}</label>
                  <span className="text-sm text-neutral-300 font-mono bg-neutral-800 px-2 py-1 rounded">
                    {template.layout.gap}
                  </span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="48"
                  step="4"
                  value={parseInt(template.layout.gap)}
                  onChange={(e) => updateLayout({ gap: `${e.target.value}px` })}
                  className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            </div>

            {/* 文本设置 */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-neutral-300">{t('templateCustomizer.layout.textSettings')}</h4>
              
              {/* 行高 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-neutral-400 font-medium">{t('templateCustomizer.layout.lineHeight')}</label>
                  <span className="text-sm text-neutral-300 font-mono bg-neutral-800 px-2 py-1 rounded">
                    {(template.designTokens.typography as { lineHeight?: number }).lineHeight || 1.5}
                  </span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="2.0"
                  step="0.1"
                  value={(template.designTokens.typography as { lineHeight?: number }).lineHeight || 1.5}
                  onChange={(e) => updateTypography({ lineHeight: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {/* 字符间距 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-neutral-400 font-medium">{t('templateCustomizer.layout.letterSpacing')}</label>
                  <span className="text-sm text-neutral-300 font-mono bg-neutral-800 px-2 py-1 rounded">
                    {(template.designTokens.typography as { letterSpacing?: string }).letterSpacing || '0px'}
                  </span>
                </div>
                <input
                  type="range"
                  min="-1"
                  max="3"
                  step="0.5"
                  value={parseFloat((template.designTokens.typography as { letterSpacing?: string }).letterSpacing || '0')}
                  onChange={(e) => updateTypography({ letterSpacing: `${e.target.value}px` })}
                  className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            </div>

            {/* 边距设置 */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-neutral-300">{t('templateCustomizer.layout.spacingSettings')}</h4>
              
              {/* 段落间距 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-neutral-400 font-medium">{t('templateCustomizer.layout.paragraphSpacing')}</label>
                  <span className="text-sm text-neutral-300 font-mono bg-neutral-800 px-2 py-1 rounded">
                    {template.designTokens.spacing.md}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.25"
                  value={parseFloat(template.designTokens.spacing.md)}
                  onChange={(e) => {
                    const updatedTemplate = {
                      ...template,
                      designTokens: {
                        ...template.designTokens,
                        spacing: {
                          ...template.designTokens.spacing,
                          md: `${e.target.value}rem`
                        }
                      }
                    };
                    onTemplateChange(updatedTemplate);
                  }}
                  className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>

              {/* 大段落间距 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-neutral-400 font-medium">{t('templateCustomizer.layout.sectionSpacing')}</label>
                  <span className="text-sm text-neutral-300 font-mono bg-neutral-800 px-2 py-1 rounded">
                    {template.designTokens.spacing.lg}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="4"
                  step="0.25"
                  value={parseFloat(template.designTokens.spacing.lg)}
                  onChange={(e) => {
                    const updatedTemplate = {
                      ...template,
                      designTokens: {
                        ...template.designTokens,
                        spacing: {
                          ...template.designTokens.spacing,
                          lg: `${e.target.value}rem`
                        }
                      }
                    };
                    onTemplateChange(updatedTemplate);
                  }}
                  className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 返回按钮 */}
      {onBack && (
        <div className="border-t border-neutral-800 p-4">
          <button
            onClick={onBack}
            className="w-full bg-neutral-700 hover:bg-neutral-600 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
          >
            {t('templateCustomizer.buttons.backToTemplates')}
          </button>
        </div>
      )}
    </div>
  );
} 