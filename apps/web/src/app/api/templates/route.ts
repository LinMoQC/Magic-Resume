import { NextResponse } from 'next/server';
import {
  getTemplateManifestById,
  getTemplateManifestList,
  magicTemplateList,
  magicTemplates,
} from '@magic-resume/resume-templates/config/magic-templates';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');

    // 如果请求特定模板
    if (templateId) {
      const manifest = getTemplateManifestById(templateId);
      if (manifest.id !== templateId) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        ...manifest.template,
        thumbnailUrl: manifest.thumbnailUrl,
      });
    }

    // 返回所有模板
    return NextResponse.json({
      templates: magicTemplates,
      defaultTemplate: 'classic',
      templateList: magicTemplateList,
      manifests: getTemplateManifestList(),
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
