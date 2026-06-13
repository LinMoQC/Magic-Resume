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
  syncResume: async (resume: Resume) => {
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

  createCloudVersion: async (resumeId: string, resume: Resume, changelog?: string) => {
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

  fetchCloudResumes: async () => {
    const response = await httpClient.api.get(API_ROUTES.resumes.list);
    return response.data.data;
  },

  fetchCloudResumeById: async (id: string) => {
    const response = await httpClient.api.get(API_ROUTES.resumes.byId(id));
    return response.data.data;
  },

  duplicateResume: async (id: string) => {
    const response = await httpClient.api.post(API_ROUTES.resumes.duplicate(id), {});
    return response.data.data;
  },

  deleteResume: async (id: string) => {
    await httpClient.api.delete(API_ROUTES.resumes.byId(id));
  },

  fetchVersions: async (resumeId: string) => {
    const response = await httpClient.api.get(API_ROUTES.resumes.versions(resumeId));
    return response.data.data;
  },

  fetchVersionById: async (resumeId: string, versionId: string) => {
    const response = await httpClient.api.get(API_ROUTES.resumes.versionById(resumeId, versionId));
    return response.data.data;
  },

  deleteVersion: async (resumeId: string, versionId: string) => {
    await httpClient.api.delete(API_ROUTES.resumes.versionById(resumeId, versionId));
  },

  updateSharing: async (resumeId: string, payload: UpdateSharingRequest) => {
    const response = await httpClient.api.patch(API_ROUTES.resumes.byId(resumeId), payload);
    return response.data.data;
  },

  /** Public — token attached automatically if user is logged in */
  fetchSharedResume: async (shareId: string) => {
    const response = await httpClient.api.get(API_ROUTES.resumes.shared(shareId));
    return response.data.data;
  },

  addComment: async (shareId: string, payload: AddCommentRequest) => {
    const response = await httpClient.api.post(API_ROUTES.resumes.sharedComments(shareId), payload);
    return response.data.data;
  },

  addReply: async (shareId: string, commentId: string, payload: AddReplyRequest) => {
    const response = await httpClient.api.post(
      API_ROUTES.resumes.sharedReplies(shareId, commentId),
      payload,
    );
    return response.data.data;
  },

  deleteComment: async (shareId: string, commentId: string) => {
    await httpClient.api.delete(API_ROUTES.resumes.sharedComment(shareId, commentId));
  },

  deleteReply: async (shareId: string, commentId: string, replyId: string) => {
    await httpClient.api.delete(API_ROUTES.resumes.sharedReply(shareId, commentId, replyId));
  },
};
