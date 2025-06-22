import { NextResponse } from 'next/server';
import { classicTemplate } from '@/templates/config/classic-template';
import { azurillTemplate } from '@/templates/config/azurill-template';
import { bronzorTemplate } from '@/templates/config/bronzor-template';
import { chikoritaTemplate } from '@/templates/config/chikorita-template';
import { dittoTemplate } from '@/templates/config/ditto-template';
import { gengarTemplate } from '@/templates/config/gengar-template';
import { orangeModernTemplate } from '@/templates/config/orange-modern-template';
import { cleanMinimalTemplate } from '@/templates/config/clean-minimal-template';
import { tealProfessionalTemplate } from '@/templates/config/teal-professional-template';
import { redAccentTemplate } from '@/templates/config/red-accent-template';
import { goldenElegantTemplate } from '@/templates/config/golden-elegant-template';
import { MagicTemplateDSL } from '@/templates/types/magic-dsl';

// 模板数据映射
const templatesData: Record<string, MagicTemplateDSL> = {
  classic: classicTemplate,
  azurill: azurillTemplate,
  bronzor: bronzorTemplate,
  chikorita: chikoritaTemplate,
  ditto: dittoTemplate,
  gengar: gengarTemplate,
  'orange-modern': orangeModernTemplate,
  'clean-minimal': cleanMinimalTemplate,
  'teal-professional': tealProfessionalTemplate,
  'red-accent': redAccentTemplate,
  'golden-elegant': goldenElegantTemplate,
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');

    // 如果请求特定模板
    if (templateId) {
      const template = templatesData[templateId];
      if (!template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(template);
    }

    // 返回所有模板
    return NextResponse.json({
      templates: templatesData,
      defaultTemplate: 'classic',
      templateList: Object.values(templatesData)
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 