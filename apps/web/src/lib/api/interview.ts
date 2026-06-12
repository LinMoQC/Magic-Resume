import { httpClient } from './httpClient';

export interface StartInterviewParams {
  resume_context: string;
  job_description?: string;
  role?: string;
  config?: Record<string, unknown>;
}

export interface ChatParams {
  session_id: string;
  message: string;
}

export interface InterviewResponse {
  session_id?: string;
  message: string;
  stage: string;
  finished?: boolean;
}

export const interviewApi = {
  
  start: async (params: StartInterviewParams): Promise<InterviewResponse> => {
    const response = await httpClient.agent.post('/api/interview/start', params);
    return response.data;
  },

  chat: async (params: ChatParams): Promise<InterviewResponse> => {
    const response = await httpClient.agent.post('/api/interview/chat', params);
    return response.data;
  },

  deleteSession: async (sessionId: string): Promise<void> => {
    await httpClient.agent.delete(`/api/interview/session/${sessionId}`);
  }
};
