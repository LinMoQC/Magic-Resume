// 模版
export { azurillTemplate } from './azurill-template'
export { bronzorTemplate } from './bronzor-template'
export { chikoritaTemplate } from './chikorita-template'
export { dittoTemplate } from './ditto-template'
export { gengarTemplate } from './gengar-template'
export { classicTemplate } from './classic-template'
export { orangeModernTemplate } from './orange-modern-template'
export { cleanMinimalTemplate } from './clean-minimal-template'
export { tealProfessionalTemplate } from './teal-professional-template'
export { redAccentTemplate } from './red-accent-template'
export { goldenElegantTemplate } from './golden-elegant-template'
export { productOpsFocusTemplate } from './product-ops-focus-template'

import { azurillTemplate } from './azurill-template'
import { bronzorTemplate } from './bronzor-template'
import { chikoritaTemplate } from './chikorita-template'
import { dittoTemplate } from './ditto-template'
import { gengarTemplate } from './gengar-template'
import { classicTemplate } from './classic-template'
import { orangeModernTemplate } from './orange-modern-template'
import { cleanMinimalTemplate } from './clean-minimal-template'
import { tealProfessionalTemplate } from './teal-professional-template'
import { redAccentTemplate } from './red-accent-template'
import { goldenElegantTemplate } from './golden-elegant-template'
import { productOpsFocusTemplate } from './product-ops-focus-template'
import { MagicTemplateDSL } from '../types/magic-dsl'
import { templateList, getTemplateById, defaultTemplate } from '../registry'

export const ALL_MAGIC_TEMPLATES: MagicTemplateDSL[] = templateList

// 根据ID获取Magic模板
export function getMagicTemplateById(id: string): MagicTemplateDSL | undefined {
  return getTemplateById(id)
}

// 根据标签筛选Magic模板
export function getMagicTemplatesByTag(tag: string): MagicTemplateDSL[] {
  return ALL_MAGIC_TEMPLATES.filter(template => template.tags.includes(tag))
}

// 获取默认Magic模板
export function getDefaultMagicTemplate(): MagicTemplateDSL {
  return defaultTemplate
}
