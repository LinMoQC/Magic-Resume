import axios from 'axios';
import { Resume } from '@/store/useResumeStore';

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
    const resumeData = { ...resume } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    delete resumeData.versions;
    const serializedContent = JSON.stringify(resumeData);

    if (isLocalId) {
      const response = await axios.post(CLOUD_API_BASE_URL, {
        title: resume.name,
        // content: resume, 
        // Backend expects serialized JSON string now
        content: serializedContent,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Backend uses TransformInterceptor, so response is { data: { ...resume }, code: 200 }
      return response.data.data;
    } else {
      const response = await axios.patch(`${CLOUD_API_BASE_URL}/${resume.id}`, {
        title: resume.name,
        // content: resume,
        // Backend expects serialized JSON string now
        content: serializedContent
      }, {
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
    const resumeData = { ...resume } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    delete resumeData.versions;
    const serializedContent = JSON.stringify(resumeData);

      const response = await axios.post(`${CLOUD_API_BASE_URL}/${resumeId}/versions`, {
        // content,
        // Backend expects serialized JSON string now
        content: serializedContent,
        changelog: changelog || 'Manual Save'
      }, {
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
      const response = await axios.get(CLOUD_API_BASE_URL, {
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
  }
};
