import axios from 'axios';
import { ApiResponse } from '@/types/common';
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

// The NestJS backend URL - should be configured in env
// For development, we'll use localhost:3111 as seen in the NestJS main.ts
const CLOUD_API_BASE_URL = `${process.env.NEXT_PUBLIC_CLOUD_API_URL || 'http://localhost:3111'}/api/resumes`;

export const resumeApi = {
  /**
   * Sync a resume to the cloud (Create or Update)
   */
  syncResume: async (resume: Resume, token: string) => {
    try {
      // First try to check if resume exists or just use upsert logic if backend supports it
      // Based on our NestJS controller, we have POST /resumes and PATCH /resumes/:id
      
      // We'll try to find it first or use a convention
      // If the ID is numeric (local Date.now()), it's likely not in the cloud yet
      const isLocalId = !isNaN(Number(resume.id)) && resume.id.length > 10;
      
    // REDUCE PAYLOAD SIZE: Strip 'versions' as they are redundant for content sync
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resumeData = { ...resume } as any;
    delete resumeData.versions;
    const serializedContent = JSON.stringify(resumeData);

    if (isLocalId) {
      const payload: SyncResumeRequest = {
        title: resume.name,
        // Backend expects serialized JSON string now
        content: serializedContent,
      };
      
      const response = await axios.post<ApiResponse<CloudResumeResponse>>(CLOUD_API_BASE_URL, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Backend uses TransformInterceptor, so response is { data: { ...resume }, code: 200 }
      return response.data.data;
    } else {
      const payload: SyncResumeRequest = {
        title: resume.name,
        // Backend expects serialized JSON string now
        content: serializedContent
      };

      const response = await axios.patch<ApiResponse<CloudResumeResponse>>(`${CLOUD_API_BASE_URL}/${resume.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
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

      const response = await axios.post<ApiResponse<CloudVersionResponse>>(`${CLOUD_API_BASE_URL}/${resumeId}/versions`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      // Use the dedicated 'mine' endpoint to ensure we only get the user's own resumes
      const response = await axios.get(`${CLOUD_API_BASE_URL}/mine`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data; // Expected { data: Resume[], total: number }
    } catch (error) {
      console.error('Failed to fetch cloud resumes:', error);
      throw error;
    }
  },

  /**
   * Fetch a single resume by ID from the cloud
   */
  fetchResumeById: async (id: string, token: string) => {
    try {
      const response = await axios.get(`${CLOUD_API_BASE_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data; // Expected { data: Resume, ... }
    } catch (error) {
      console.error(`Failed to fetch cloud resume ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a resume from the cloud
   */
  deleteResume: async (id: string, token: string) => {
    try {
      const response = await axios.delete(`${CLOUD_API_BASE_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to delete cloud resume ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a specific version of a resume from the cloud
   */
  deleteVersion: async (resumeId: string, versionId: string, token: string) => {
    try {
      const response = await axios.delete(`${CLOUD_API_BASE_URL}/${resumeId}/versions/${versionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to delete version ${versionId} for resume ${resumeId}:`, error);
      throw error;
    }
  },

  /**
   * Update sharing settings
   */
  updateSharing: async (id: string, settings: UpdateSharingRequest, token: string) => {
    try {
      const response = await axios.patch<ApiResponse<CloudResumeResponse>>(`${CLOUD_API_BASE_URL}/${id}`, {
        ...settings
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    } catch (error) {
      console.error(`Failed to update sharing for resume ${id}:`, error);
      throw error;
    }
  },

  /**
   * Fetch a shared resume by shareId (Public access)
   */
  fetchSharedResume: async (shareId: string) => {
    try {
      const response = await axios.get(`${CLOUD_API_BASE_URL}/shared/${shareId}`);
      return response.data.data;
    } catch (error) {
      console.error(`Failed to fetch shared resume ${shareId}:`, error);
      throw error;
    }
  },

  /**
   * Add a comment to a resume
   */
  addComment: async (resumeId: string, content: string, extra: { position?: Record<string, unknown>, color?: string, selectedText?: string }, token: string) => {
    try {
      const payload: AddCommentRequest = {
        content,
        ...extra
      };
      const response = await axios.post<ApiResponse<unknown>>(`${CLOUD_API_BASE_URL}/${resumeId}/comments`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    } catch (error) {
      console.error(`Failed to add comment to resume ${resumeId}:`, error);
      throw error;
    }
  },

  /**
   * Add a reply to a comment
   */
  addReply: async (resumeId: string, commentId: string, content: string, token: string) => {
    try {
      const payload: AddReplyRequest = { content };
      const response = await axios.post<ApiResponse<unknown>>(`${CLOUD_API_BASE_URL}/${resumeId}/comments/${commentId}/replies`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    } catch (error) {
      console.error(`Failed to add reply to comment ${commentId}:`, error);
      throw error;
    }
  },

  /**
   * Delete a comment
   */
  deleteComment: async (resumeId: string, commentId: string, token: string) => {
    try {
      const response = await axios.delete(`${CLOUD_API_BASE_URL}/${resumeId}/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to delete comment ${commentId}:`, error);
      throw error;
    }
  },

  /**
   * Duplicate a resume
   */
  duplicateResume: async (id: string, token: string) => {
    try {
      const response = await axios.post(`${CLOUD_API_BASE_URL}/${id}/duplicate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    } catch (error) {
      console.error(`Failed to duplicate resume ${id}:`, error);
      throw error;
    }
  }
};
