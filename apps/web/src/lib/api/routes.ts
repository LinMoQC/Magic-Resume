/**
 * The single API origin — the whole frontend talks to ONE configured address.
 * Resolved at RUNTIME so one build can target any backend:
 *   - browser → `window.__ENV.apiOrigin`, injected by CommercialRuntimeProvider
 *   - server  → `process.env.APP_API_ORIGIN` (container env, read per request)
 *   - fallback → build-time `NEXT_PUBLIC_API_URL` / dev default
 * The runtime var is deliberately WITHOUT the `NEXT_PUBLIC_` prefix: Next inlines
 * `NEXT_PUBLIC_*` at build time into BOTH client and server bundles, which would
 * freeze the address into the image. A prefix-less var is read from the container
 * env at runtime (server), then shipped to the browser via `window.__ENV`.
 * Lives in this dep-free module so both client and server can import it without
 * pulling axios in via httpClient.
 */
type CommercialRuntime = { apiOrigin?: string };
declare global {
  interface Window {
    __ENV?: CommercialRuntime;
  }
}

function resolveApiOrigin(): string {
  if (typeof window !== 'undefined') {
    return window.__ENV?.apiOrigin || 'http://localhost:3110';
  }
  return (
    process.env.APP_API_ORIGIN ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3110'
  );
}

export const API_ORIGIN = resolveApiOrigin();

/**
 * Product API routes.
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
  // 校招时间线公开读（匿名可访问，gateway allowlist 已放行该精确路径）
  knowledge: {
    timelines: '/api/knowledge/timelines',
  },
} as const;

/**
 * AI-related API routes.
 */
export const AGENT_ROUTES = {
  interview: {
    start:   '/api/interview/start',
    chat:    '/api/interview/chat',
    session: (sessionId: string) => `/api/interview/session/${sessionId}`,
  },
} as const;

/**
 * Web-side AI route handlers. Centralizes the paths the AI Lab service layer
 * (`ai/lib/services`) calls so they aren't hardcoded inline.
 */
export const WEB_AGENT_ROUTES = {
  chat:             '/api/chat-agent',
  chatApprove:      '/api/chat-agent/approve',
  chatSession:      '/api/chat-agent/session',
  chatEdit:         '/api/chat-agent/edit',
  pdfParse:         '/api/pdf/parse',
} as const;
