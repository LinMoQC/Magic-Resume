import type { TemplateId } from '@magic-resume/resume-schema';
import { azurillTemplate } from './config/azurill-template';
import { bronzorTemplate } from './config/bronzor-template';
import { chikoritaTemplate } from './config/chikorita-template';
import { classicTemplate } from './config/classic-template';
import { cleanMinimalTemplate } from './config/clean-minimal-template';
import { dittoTemplate } from './config/ditto-template';
import { gengarTemplate } from './config/gengar-template';
import { goldenElegantTemplate } from './config/golden-elegant-template';
import { orangeModernTemplate } from './config/orange-modern-template';
import { productOpsFocusTemplate } from './config/product-ops-focus-template';
import { redAccentTemplate } from './config/red-accent-template';
import { tealProfessionalTemplate } from './config/teal-professional-template';
import type { MagicTemplateDSL } from './types/magic-dsl';

export type TemplateManifest = {
  id: TemplateId;
  name: string;
  description: string;
  tags: string[];
  status: MagicTemplateDSL['status'];
  thumbnailUrl: string;
  template: MagicTemplateDSL;
};

const createManifest = (template: MagicTemplateDSL): TemplateManifest => {
  const thumbnailUrl = `/templates/jpg/${template.id}.jpg`;

  return {
    id: template.id as TemplateId,
    name: template.name,
    description: template.description,
    tags: template.tags,
    status: template.status,
    thumbnailUrl,
    template: {
      ...template,
      thumbnailUrl,
    },
  };
};

export const defaultTemplateId = 'classic' satisfies TemplateId;

export const templateRegistry: Record<TemplateId, TemplateManifest> = {
  classic: createManifest(classicTemplate),
  azurill: createManifest(azurillTemplate),
  bronzor: createManifest(bronzorTemplate),
  chikorita: createManifest(chikoritaTemplate),
  ditto: createManifest(dittoTemplate),
  gengar: createManifest(gengarTemplate),
  'orange-modern': createManifest(orangeModernTemplate),
  'clean-minimal': createManifest(cleanMinimalTemplate),
  'teal-professional': createManifest(tealProfessionalTemplate),
  'red-accent': createManifest(redAccentTemplate),
  'golden-elegant': createManifest(goldenElegantTemplate),
  'product-ops-focus': createManifest(productOpsFocusTemplate),
};

export const templateManifestList = Object.values(templateRegistry);

export const templateList = templateManifestList.map((manifest) => manifest.template);

export const templatesById = Object.fromEntries(
  templateManifestList.map((manifest) => [manifest.id, manifest.template]),
) as Record<TemplateId, MagicTemplateDSL>;

export const defaultTemplate = templateRegistry[defaultTemplateId].template;

export function getTemplateById(id: string): MagicTemplateDSL {
  return templateRegistry[id as TemplateId]?.template ?? defaultTemplate;
}

export function getTemplateManifestById(id: string): TemplateManifest {
  return templateRegistry[id as TemplateId] ?? templateRegistry[defaultTemplateId];
}

export function getTemplateManifestList(): TemplateManifest[] {
  return templateManifestList;
}
