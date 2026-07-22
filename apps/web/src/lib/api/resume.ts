import type { Operation } from 'fast-json-patch';
import { httpClient, ApiResponse } from './httpClient';
import { Resume } from '@/types/frontend/resume';
import {
  SyncResumeRequest,
  CreateVersionRequest,
  UpdateSharingRequest,
  AddCommentRequest,
  AddReplyRequest,
  CloudResumeResponse,
  CloudResumeListResponse,
  CloudVersionResponse,
} from '@/types/backend/resume';
import { API_ROUTES, API_ORIGIN } from './routes';

/**
 * A resume that only exists locally (never synced) has a numeric timestamp id
 * (Date.now().toString()); cloud resumes use CUIDs. Centralised so every call site
 * classifies ids the same way instead of re-deriving the rule inline.
 */
export const isLocalResumeId = (id: string): boolean =>
  !isNaN(Number(id)) && id.length > 10;

/**
 * 推送文档 = 前端 Resume 去掉 versions(体积大且服务端另有版本表)。
 * 同步(全量/增量 diff 基线/keepalive)统一用这一个构造,保证"客户端认为推了什么"
 * 与"服务端存了什么"永远一致。
 */
export const buildSyncDoc = (resume: Resume): Record<string, unknown> => {
  const doc = { ...resume } as Record<string, unknown>;
  delete doc.versions;
  return doc;
};

export type SyncResumeOptions = {
  /** 乐观锁基线:携带时服务端做条件写,revision 不匹配 → 409。 */
  baseRevision?: number;
  /** 增量推送:RFC 6902 ops(客户端 fast-json-patch.compare 生成);必须与 baseRevision 同时给。 */
  patchOps?: Operation[];
};

export const resumeApi = {
  /**
   * 将简历同步到云端。
   * 本地临时 ID（纯数字且长度 > 10）→ POST 创建（恒全量）；云端 ID → PATCH 更新。
   * PATCH 依选项走三种形态:增量(patchOps+baseRevision) / 条件全量(baseRevision) / 无条件全量。
   */
  syncResume: async (resume: Resume, options?: SyncResumeOptions): Promise<CloudResumeResponse> => {
    const isLocalId = isLocalResumeId(resume.id);

    if (isLocalId) {
      const response = await httpClient.api.post<ApiResponse<CloudResumeResponse>>(
        API_ROUTES.resumes.create,
        { title: resume.name, content: JSON.stringify(buildSyncDoc(resume)) },
      );
      return response.data.data;
    }

    const payload: SyncResumeRequest = { title: resume.name };
    if (options?.patchOps && options.baseRevision !== undefined) {
      payload.contentPatch = JSON.stringify(options.patchOps);
      payload.baseRevision = options.baseRevision;
    } else {
      payload.content = JSON.stringify(buildSyncDoc(resume));
      if (options?.baseRevision !== undefined) payload.baseRevision = options.baseRevision;
    }

    const response = await httpClient.api.patch<ApiResponse<CloudResumeResponse>>(
      API_ROUTES.resumes.byId(resume.id),
      payload,
    );
    return response.data.data;
  },

  /**
   * 退出送达(pagehide):keepalive fetch 绕过 axios,页面卸载后浏览器仍会送出请求。
   * 无条件全量(退出后无人处理 409,LWW 语义与旧版一致;下次会话冲突由 409 恢复流程收敛)。
   * 尽力而为:body >64KB 或 token 过期即失败,静默退化为"下次会话再同步"。
   */
  syncResumeKeepalive: (resume: Resume, token: string): void => {
    if (isLocalResumeId(resume.id)) return; // 本地未建行,退出场景没有可 PATCH 的目标
    try {
      void fetch(`${API_ORIGIN}${API_ROUTES.resumes.byId(resume.id)}`, {
        method: 'PATCH',
        keepalive: true,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: resume.name,
          content: JSON.stringify(buildSyncDoc(resume)),
        } satisfies SyncResumeRequest),
      }).catch(() => {
        // best-effort;失败无人可通知
      });
    } catch {
      // 同上:同步抛错(如 body 超限)也静默
    }
  },

  /**
   * 用已序列化的 content 原样创建版本快照 —— 409 冲突恢复时把"远端当前内容"备份为
   * 历史版本用(内容来自 GET,本就是序列化串,不经过前端 Resume 反序列化,避免丢字段)。
   */
  createCloudVersionRaw: async (resumeId: string, content: string, changelog: string): Promise<CloudVersionResponse> => {
    const response = await httpClient.api.post<ApiResponse<CloudVersionResponse>>(
      API_ROUTES.resumes.versions(resumeId),
      { content, changelog } satisfies CreateVersionRequest,
    );
    return response.data.data;
  },

  /** 为指定简历在云端创建一个新版本快照 */
  createCloudVersion: async (resumeId: string, resume: Resume, changelog?: string): Promise<CloudVersionResponse> => {
    const payload: CreateVersionRequest = {
      content: JSON.stringify(buildSyncDoc(resume)),
      changelog: changelog || 'Manual Save',
    };
    const response = await httpClient.api.post<ApiResponse<CloudVersionResponse>>(
      API_ROUTES.resumes.versions(resumeId),
      payload,
    );
    return response.data.data;
  },

  /** 获取当前用户的所有云端简历（分页信封:{ data, total, page, limit }） */
  fetchCloudResumes: async (): Promise<CloudResumeListResponse> => {
    const response = await httpClient.api.get<ApiResponse<CloudResumeListResponse>>(API_ROUTES.resumes.list);
    return response.data.data;
  },

  /** 按 ID 获取单份云端简历的完整数据 */
  fetchCloudResumeById: async (id: string): Promise<CloudResumeResponse> => {
    const response = await httpClient.api.get<ApiResponse<CloudResumeResponse>>(API_ROUTES.resumes.byId(id));
    return response.data.data;
  },

  /** 在云端复制一份简历，返回新简历数据 */
  duplicateResume: async (id: string) => {
    const response = await httpClient.api.post(API_ROUTES.resumes.duplicate(id), {});
    return response.data.data;
  },

  /** 从云端永久删除指定简历 */
  deleteResume: async (id: string): Promise<void> => {
    await httpClient.api.delete(API_ROUTES.resumes.byId(id));
  },

  /** 获取指定简历的所有历史版本列表 */
  fetchVersions: async (resumeId: string) => {
    const response = await httpClient.api.get(API_ROUTES.resumes.versions(resumeId));
    return response.data.data;
  },

  /** 获取指定简历的单个历史版本详情 */
  fetchVersionById: async (resumeId: string, versionId: string) => {
    const response = await httpClient.api.get(API_ROUTES.resumes.versionById(resumeId, versionId));
    return response.data.data;
  },

  /** 删除指定简历的某个历史版本 */
  deleteVersion: async (resumeId: string, versionId: string): Promise<void> => {
    await httpClient.api.delete(API_ROUTES.resumes.versionById(resumeId, versionId));
  },

  /** 更新简历的分享设置（是否公开、分享权限） */
  updateSharing: async (resumeId: string, payload: UpdateSharingRequest) => {
    const response = await httpClient.api.patch(API_ROUTES.resumes.byId(resumeId), payload);
    return response.data.data;
  },

  /** 通过分享短链接获取公开简历（无需登录，已登录时会附带 token） */
  fetchSharedResume: async (shareId: string) => {
    const response = await httpClient.api.get(API_ROUTES.resumes.shared(shareId));
    return response.data.data;
  },

  /** 在分享简历上添加评论标注 */
  addComment: async (shareId: string, payload: AddCommentRequest) => {
    const response = await httpClient.api.post(API_ROUTES.resumes.sharedComments(shareId), payload);
    return response.data.data;
  },

  /** 回复指定评论 */
  addReply: async (shareId: string, commentId: string, payload: AddReplyRequest) => {
    const response = await httpClient.api.post(
      API_ROUTES.resumes.sharedReplies(shareId, commentId),
      payload,
    );
    return response.data.data;
  },

  /** 删除指定评论（仅评论作者或简历所有者可操作） */
  deleteComment: async (shareId: string, commentId: string): Promise<void> => {
    await httpClient.api.delete(API_ROUTES.resumes.sharedComment(shareId, commentId));
  },

  /** 删除指定评论的某条回复 */
  deleteReply: async (shareId: string, commentId: string, replyId: string): Promise<void> => {
    await httpClient.api.delete(API_ROUTES.resumes.sharedReply(shareId, commentId, replyId));
  },
};
