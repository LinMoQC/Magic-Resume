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
  /** 创建面试会话，返回初始问候语和 session_id */
  start: async (params: StartInterviewParams): Promise<InterviewResponse> => {
    const response = await httpClient.agent.post(AGENT_ROUTES.interview.start, params);
    return response.data;
  },

  /** 向指定会话发送用户消息，返回面试官回复 */
  chat: async (params: ChatParams): Promise<InterviewResponse> => {
    const response = await httpClient.agent.post(AGENT_ROUTES.interview.chat, params);
    return response.data;
  },

  /** 销毁指定面试会话，释放服务端资源 */
  deleteSession: async (sessionId: string): Promise<void> => {
    await httpClient.agent.delete(AGENT_ROUTES.interview.session(sessionId));
  },
};
