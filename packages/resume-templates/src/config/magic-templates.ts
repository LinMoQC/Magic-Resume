import { MagicTemplateDSL } from '../types/magic-dsl';
import {
  defaultTemplate,
  getTemplateById,
  getTemplateManifestById,
  getTemplateManifestList,
  templateList,
  templatesById,
} from '../registry';

export const magicTemplates: Record<string, MagicTemplateDSL> = templatesById;
export const defaultMagicTemplate = defaultTemplate;
export const magicTemplateList = templateList;

export async function getMagicTemplates(): Promise<Record<string, MagicTemplateDSL>> {
  return magicTemplates;
}

export async function getDefaultMagicTemplate(): Promise<MagicTemplateDSL> {
  return defaultMagicTemplate;
}

export async function getMagicTemplateList(): Promise<MagicTemplateDSL[]> {
  return magicTemplateList;
}

export async function getMagicTemplateById(id: string): Promise<MagicTemplateDSL> {
  return getTemplateById(id);
}

export { getTemplateManifestById, getTemplateManifestList };

export default magicTemplates;
