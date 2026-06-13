import { httpClient, ApiResponse } from './httpClient';
import { Resume } from '@/types/frontend/resume';
import {
  SyncResumeRequest,
  CreateVersionRequest,
  UpdateSharingRequest,
  AddCommentRequest,
  AddReplyRequest,
  CloudResumeResponse,
  CloudVersionResponse,
} from '@/types/backend/resume';
import { API_ROUTES } from './routes';

export const resumeApi = {
  /**
   * 将简历同步到云端。
   * 本地临时 ID（纯数字且长度 > 10）→ POST 创建；云端 ID → PATCH 更新。
   */
  syncResume: async (resume: Resume): Promise<CloudResumeResponse> => {
    const isLocalId = !isNaN(Number(resume.id)) && resume.id.length > 10;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resumeData = { ...resume } as any;
    delete resumeData.versions;
    const payload: SyncResumeRequest = {
      title: resume.name,
      content: JSON.stringify(resumeData),
    };

    if (isLocalId) {
      const response = await httpClient.api.post<ApiResponse<CloudResumeResponse>>(
        API_ROUTES.resumes.create,
        payload,
      );
      return response.data.data;
    } else {
      const response = await httpClient.api.patch<ApiResponse<CloudResumeResponse>>(
        API_ROUTES.resumes.byId(resume.id),
        payload,
      );
      return response.data.data;
    }
  },

  /** 为指定简历在云端创建一个新版本快照 */
  createCloudVersion: async (resumeId: string, resume: Resume, changelog?: string): Promise<CloudVersionResponse> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resumeData = { ...resume } as any;
    delete resumeData.versions;
    const payload: CreateVersionRequest = {
      content: JSON.stringify(resumeData),
      changelog: changelog || 'Manual Save',
    };
    const response = await httpClient.api.post<ApiResponse<CloudVersionResponse>>(
      API_ROUTES.resumes.versions(resumeId),
      payload,
    );
    return response.data.data;
  },

  /** 获取当前用户的所有云端简历（含版本信息） */
  fetchCloudResumes: async () => {
    const response = await httpClient.api.get(API_ROUTES.resumes.list);
    return response.data.data;
  },

  /** 按 ID 获取单份云端简历的完整数据 */
  fetchCloudResumeById: async (id: string) => {
    const response = await httpClient.api.get(API_ROUTES.resumes.byId(id));
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
