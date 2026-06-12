import { httpClient, withAuth, ApiResponse } from './httpClient';
import { Resume } from '@/types/frontend/resume';
import { 
  SyncResumeRequest, 
  CreateVersionRequest, 
  UpdateSharingRequest, 
  AddCommentRequest,
  AddReplyRequest,
  CloudResumeResponse,
  CloudVersionResponse
} from '@/types/backend/resume';

export const resumeApi = {
  /**
   * Sync a resume to the cloud (Create or Update)
   */
  syncResume: async (resume: Resume, token: string) => {
    try {
      // If the ID is numeric (local Date.now()), it's likely not in the cloud yet
      const isLocalId = !isNaN(Number(resume.id)) && resume.id.length > 10;
      
      // REDUCE PAYLOAD SIZE: Strip 'versions' as they are redundant for content sync
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resumeData = { ...resume } as any;
      delete resumeData.versions;
      const serializedContent = JSON.stringify(resumeData);

      const payload: SyncResumeRequest = {
        title: resume.name,
        content: serializedContent,
      };

      if (isLocalId) {
        const response = await httpClient.api.post<ApiResponse<CloudResumeResponse>>(
          '/api/resumes', 
          payload, 
          withAuth(token)
        );
        return response.data.data;
      } else {
        const response = await httpClient.api.patch<ApiResponse<CloudResumeResponse>>(
          `/api/resumes/${resume.id}`, 
          payload, 
          withAuth(token)
        );
        return response.data.data;
      }
    } catch (error) {
      console.error('Failed to sync resume to cloud:', error);
      throw error;
    }
  },

  /**
   * Create a new version in the cloud
   */
  createCloudVersion: async (resumeId: string, resume: Resume, token: string, changelog?: string) => {
    try {
      // REDUCE PAYLOAD SIZE: Strip 'versions' before stringifying
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resumeData = { ...resume } as any;
      delete resumeData.versions;
      const serializedContent = JSON.stringify(resumeData);

      const payload: CreateVersionRequest = {
        content: serializedContent,
        changelog: changelog || 'Manual Save'
      };

      const response = await httpClient.api.post<ApiResponse<CloudVersionResponse>>(
        `/api/resumes/${resumeId}/versions`, 
        payload, 
        withAuth(token)
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to create cloud version:', error);
      throw error;
    }
  },

  /**
   * Fetch all cloud resumes for the current user
   */
  fetchCloudResumes: async (token: string) => {
    try {
      const response = await httpClient.api.get('/api/resumes/mine', withAuth(token));
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch cloud resumes:', error);
      throw error;
    }
  },

  /**
   * Fetch a specific cloud resume by ID
   */
  fetchCloudResumeById: async (id: string, token: string) => {
    try {
      const response = await httpClient.api.get(`/api/resumes/${id}`, withAuth(token));
      return response.data.data;
    } catch (error) {
      console.error(`Failed to fetch cloud resume ${id}:`, error);
      throw error;
    }
  },

  /**
   * Duplicate a cloud resume
   */
  duplicateResume: async (id: string, token: string) => {
    try {
      const response = await httpClient.api.post(`/api/resumes/${id}/duplicate`, {}, withAuth(token));
      return response.data.data;
    } catch (error) {
      console.error(`Failed to duplicate cloud resume ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a cloud resume
   */
  deleteResume: async (id: string, token: string) => {
    try {
      await httpClient.api.delete(`/api/resumes/${id}`, withAuth(token));
    } catch (error) {
      console.error(`Failed to delete cloud resume ${id}:`, error);
      throw error;
    }
  },

  /**
   * Fetch all versions for a resume
   */
  fetchVersions: async (resumeId: string, token: string) => {
    try {
      const response = await httpClient.api.get(`/api/resumes/${resumeId}/versions`, withAuth(token));
      return response.data.data;
    } catch (error) {
      console.error(`Failed to fetch versions for resume ${resumeId}:`, error);
      throw error;
    }
  },

  /**
   * Fetch a specific version
   */
  fetchVersionById: async (resumeId: string, versionId: string, token: string) => {
    try {
      const response = await httpClient.api.get(
        `/api/resumes/${resumeId}/versions/${versionId}`, 
        withAuth(token)
      );
      return response.data.data;
    } catch (error) {
      console.error(`Failed to fetch version ${versionId}:`, error);
      throw error;
    }
  },

  /**
   * Delete a version
   */
  deleteVersion: async (resumeId: string, versionId: string, token: string) => {
    try {
      await httpClient.api.delete(
        `/api/resumes/${resumeId}/versions/${versionId}`, 
        withAuth(token)
      );
    } catch (error) {
      console.error(`Failed to delete version ${versionId}:`, error);
      throw error;
    }
  },

  /**
   * Update sharing settings for a resume
   */
  updateSharing: async (resumeId: string, payload: UpdateSharingRequest, token: string) => {
    try {
      // Sharing is updated through the main PATCH endpoint
      const response = await httpClient.api.patch(
        `/api/resumes/${resumeId}`, 
        payload, 
        withAuth(token)
      );
      return response.data.data;
    } catch (error) {
      console.error(`Failed to update sharing for resume ${resumeId}:`, error);
      throw error;
    }
  },

  /**
   * Fetch a shared resume by shareId (public, no auth required)
   */
  fetchSharedResume: async (shareId: string) => {
    try {
      const response = await httpClient.api.get(`/api/resumes/shared/${shareId}`);
      return response.data.data;
    } catch (error) {
      console.error(`Failed to fetch shared resume ${shareId}:`, error);
      throw error;
    }
  },

  /**
   * Add a comment to a shared resume
   */
  addComment: async (shareId: string, payload: AddCommentRequest, token?: string) => {
    try {
      const config = token ? withAuth(token) : {};
      const response = await httpClient.api.post(
        `/api/resumes/shared/${shareId}/comments`, 
        payload, 
        config
      );
      return response.data.data;
    } catch (error) {
      console.error(`Failed to add comment to shared resume ${shareId}:`, error);
      throw error;
    }
  },

  /**
   * Add a reply to a comment
   */
  addReply: async (shareId: string, commentId: string, payload: AddReplyRequest, token?: string) => {
    try {
      const config = token ? withAuth(token) : {};
      const response = await httpClient.api.post(
        `/api/resumes/shared/${shareId}/comments/${commentId}/replies`, 
        payload, 
        config
      );
      return response.data.data;
    } catch (error) {
      console.error(`Failed to add reply to comment ${commentId}:`, error);
      throw error;
    }
  },

  /**
   * Delete a comment
   */
  deleteComment: async (shareId: string, commentId: string, token: string) => {
    try {
      await httpClient.api.delete(
        `/api/resumes/shared/${shareId}/comments/${commentId}`, 
        withAuth(token)
      );
    } catch (error) {
      console.error(`Failed to delete comment ${commentId}:`, error);
      throw error;
    }
  },

  /**
   * Delete a reply
   */
  deleteReply: async (shareId: string, commentId: string, replyId: string, token: string) => {
    try {
      await httpClient.api.delete(
        `/api/resumes/shared/${shareId}/comments/${commentId}/replies/${replyId}`, 
        withAuth(token)
      );
    } catch (error) {
      console.error(`Failed to delete reply ${replyId}:`, error);
      throw error;
    }
  }
};
