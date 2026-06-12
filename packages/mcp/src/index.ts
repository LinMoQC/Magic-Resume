export { createApiClient, type MagicResumeApiClientOptions } from './client.js';
export { loadConfig, saveConfig, type MagicResumeCliConfig } from './config.js';
export {
  applyResumePatch,
  buildEditablePaths,
  buildResumeDetail,
  buildResumeEditingGuide,
  buildResumeList,
  buildResumeSchemaGuide,
  parseResumeContent,
  previewResumePatch,
  resolveResumeId,
  serializeResumeContent,
  updateResumeContent,
} from './resume-tools.js';
export { startMcpServer } from './server.js';
