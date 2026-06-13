export * from './config';
export * from './config/defaults';
export {
  defaultMagicTemplate,
  getMagicTemplates,
  magicTemplateList,
  magicTemplates,
} from './config/magic-templates';
export * from './registry';
export * from './renderer/MagicResumeRenderer';
export * from './types/magic-dsl';
export * from './types/resume';
export { default as TemplateCustomizer } from './TemplateCustomizer';
