import { httpClient } from './httpClient';
import { AGENT_ROUTES } from './routes';

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
    const response = await httpClient.agent.post(AGENT_ROUTES.interview.start, params);
    return response.data;
  },

  chat: async (params: ChatParams): Promise<InterviewResponse> => {
    const response = await httpClient.agent.post(AGENT_ROUTES.interview.chat, params);
    return response.data;
  },

  deleteSession: async (sessionId: string): Promise<void> => {
    await httpClient.agent.delete(AGENT_ROUTES.interview.session(sessionId));
  }
};
