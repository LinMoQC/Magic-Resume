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
 * Agent API routes (httpClient.agent → Python backend)
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
