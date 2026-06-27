/**
 * The single backend origin — the whole frontend talks to ONE API address:
 * Magic-Core's edge gateway (`apps/gateway`), which routes by path prefix to
 * agent-service / platform-api. ONE variable only (`NEXT_PUBLIC_API_URL`,
 * resolved identically in browser + server); no legacy per-service fallback.
 * Lives in this dep-free module so both client and server can import it without
 * pulling axios in via httpClient.
 */
export const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3110';

/**
 * Core API routes (httpClient.api → NestJS backend)
 */
export const API_ROUTES = {
  resumes: {
    list:            '/api/resumes/mine',
    create:          '/api/resumes',
    byId:            (id: string) => `/api/resumes/${id}`,
    duplicate:       (id: string) => `/api/resumes/${id}/duplicate`,
    versions:        (id: string) => `/api/resumes/${id}/versions`,
    versionById:     (id: string, versionId: string) => `/api/resumes/${id}/versions/${versionId}`,
    shared:          (shareId: string) => `/api/resumes/shared/${shareId}`,
    sharedComments:  (shareId: string) => `/api/resumes/shared/${shareId}/comments`,
    sharedComment:   (shareId: string, commentId: string) => `/api/resumes/shared/${shareId}/comments/${commentId}`,
    sharedReplies:   (shareId: string, commentId: string) => `/api/resumes/shared/${shareId}/comments/${commentId}/replies`,
    sharedReply:     (shareId: string, commentId: string, replyId: string) => `/api/resumes/shared/${shareId}/comments/${commentId}/replies/${replyId}`,
  },
  users: {
    feedback:  '/api/users/feedback',
    pats:      '/api/users/me/personal-access-tokens',
    patRevoke: (tokenId: string) => `/api/users/me/personal-access-tokens/${tokenId}/revoke`,
  },
  notifications: {
    list:     '/api/notifications',
    markRead: (id: string) => `/api/notifications/${id}/read`,
  },
} as const;

/**
 * Agent API routes (httpClient.agent → Magic-Core agent-service)
 */
export const AGENT_ROUTES = {
  interview: {
    start:   '/api/interview/start',
    chat:    '/api/interview/chat',
    session: (sessionId: string) => `/api/interview/session/${sessionId}`,
  },
  translate: {
    text:   '/api/translate/text',
    stream: '/api/translate/stream',
  },
} as const;

/**
 * Web-side AI gateway routes — Next.js route handlers that proxy to the
 * Magic-Core agent-service (design §3.8). Centralizes the paths the AI Lab
 * service layer (`ai/lib/services`) calls so they aren't hardcoded inline.
 */
export const WEB_AGENT_ROUTES = {
  analyzeMulti:     '/api/analyze_multi',
  optimizerRewrite: '/api/optimizer-agent/rewrite',
  chat:             '/api/chat-agent',
  chatApprove:      '/api/chat-agent/approve',
} as const;
