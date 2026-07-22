import { Resume } from '../frontend/resume';

// --- Requests ---

export type CreateResumeRequest = {
  title: string;
  content: string; // Serialized JSON
};

export type SyncResumeRequest = {
  title: string;
  /** 全量推送:序列化 JSON。与 contentPatch 互斥。 */
  content?: string;
  /** 增量推送:RFC 6902 ops 数组的序列化字符串;必须伴随 baseRevision(见 docs/specs/cloud-sync-v2)。 */
  contentPatch?: string;
  /** 乐观锁基线:客户端最后已知的云端 revision;服务端不匹配时返回 409。 */
  baseRevision?: number;
};

export type CreateVersionRequest = {
  content: string; // Serialized JSON
  changelog: string;
};

export type UpdateSharingRequest = {
  isPublic: boolean;
  shareRole?: 'VIEWER' | 'COMMENTER' | 'EDITOR';
};

export type AddCommentRequest = {
  content: string;
  position?: Record<string, unknown>;
  color?: string;
  selectedText?: string;
};

export type AddReplyRequest = {
  content: string;
};

// --- Responses ---

// The backend returns a wrapped response, usually data is nested in `data` field
// Using the common ApiResponse type if applicable, but defining specific data shapes here

/**
 * PATCH/POST /resumes 返回的云端行(platform-api Resume 模型解密后的形状)。
 * 注意它不是前端 Resume:content 是序列化字符串,时间是 ISO 串,并携带乐观锁 revision。
 */
export type CloudResumeResponse = {
  id: string;
  title: string;
  updatedAt: string;
  /** 乐观锁版本号:记录下来作为下次 PATCH 的 baseRevision。 */
  revision?: number;
  content?: string | object;
  isPublic?: boolean;
  shareId?: string;
  shareRole?: string;
};

/** 列表接口(GET /api/resumes/mine)的分页信封:服务端 findAll 的返回形状。 */
export type CloudResumeListResponse = {
  data: CloudResumeResponse[];
  total: number;
  page: number;
  limit: number;
};

export type CloudVersionResponse = {
  id: string;
  resumeId: string;
  content: string; // Serialized JSON
  changelog: string;
  createdAt: string;
  /** 建版本会 bump resume.revision;服务端把新值带回,客户端回写乐观锁基线。 */
  resumeRevision?: number;
};

export type DuplicateResumeResponse = Resume;
