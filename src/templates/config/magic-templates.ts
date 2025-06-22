import { templateService } from '@/services/templateService';
import { MagicTemplateDSL } from '../types/magic-dsl';

// 使用API获取模板的异步函数
export async function getMagicTemplates(): Promise<Record<string, MagicTemplateDSL>> {
  const data = await templateService.getAllTemplates();
  return data.templates;
}

export async function getDefaultMagicTemplate(): Promise<MagicTemplateDSL> {
  return await templateService.getDefaultTemplate();
}

export async function getMagicTemplateList(): Promise<MagicTemplateDSL[]> {
  const data = await templateService.getAllTemplates();
  return data.templateList;
}

export async function getMagicTemplateById(id: string): Promise<MagicTemplateDSL> {
  return await templateService.getTemplateById(id);
}

// 为了兼容性，保留同步导出（使用空对象，实际使用时需要异步加载）
export const magicTemplates: Record<string, MagicTemplateDSL> = {};
export const magicTemplateList: MagicTemplateDSL[] = [];
export const defaultMagicTemplate: MagicTemplateDSL | null = null;

export default magicTemplates; 