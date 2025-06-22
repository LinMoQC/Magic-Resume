// 模版
export { azurillTemplate } from './azurill-template'
export { bronzorTemplate } from './bronzor-template'
export { chikoritaTemplate } from './chikorita-template'
export { dittoTemplate } from './ditto-template'
export { gengarTemplate } from './gengar-template'
export { classicTemplate } from './classic-template'

import { azurillTemplate } from './azurill-template'
import { bronzorTemplate } from './bronzor-template'
import { chikoritaTemplate } from './chikorita-template'
import { dittoTemplate } from './ditto-template'
import { gengarTemplate } from './gengar-template'
import { classicTemplate } from './classic-template'
import { MagicTemplateDSL } from '../types/magic-dsl'

export const ALL_MAGIC_TEMPLATES: MagicTemplateDSL[] = [
  classicTemplate,
  azurillTemplate,
  bronzorTemplate,
  chikoritaTemplate,
  dittoTemplate,
  gengarTemplate
]

// 根据ID获取Magic模板
export function getMagicTemplateById(id: string): MagicTemplateDSL | undefined {
  return ALL_MAGIC_TEMPLATES.find(template => template.id === id)
}

// 根据标签筛选Magic模板
export function getMagicTemplatesByTag(tag: string): MagicTemplateDSL[] {
  return ALL_MAGIC_TEMPLATES.filter(template => template.tags.includes(tag))
}

// 获取默认Magic模板
export function getDefaultMagicTemplate(): MagicTemplateDSL {
  return classicTemplate
}
