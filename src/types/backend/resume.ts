import { Resume } from '../frontend/resume';

// --- Requests ---

export type CreateResumeRequest = {
  title: string;
  content: string; // Serialized JSON
};

export type SyncResumeRequest = {
  title: string;
  content: string; // Serialized JSON
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

export type CloudResumeResponse = Resume;

export type CloudVersionResponse = {
  id: string;
  resumeId: string;
  content: string; // Serialized JSON
  changelog: string;
  createdAt: string;
};

export type DuplicateResumeResponse = Resume;
