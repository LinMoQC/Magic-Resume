
import axios from 'axios';

// Define base URL - assuming proxy is set up or CORS allows 
// If running locally, backend might be on localhost:8000
const API_BASE_URL = 'http://localhost:8000/api'; 

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
    const response = await axios.post(`${API_BASE_URL}/interview/start`, params);
    return response.data;
  },

  chat: async (params: ChatParams): Promise<InterviewResponse> => {
    const response = await axios.post(`${API_BASE_URL}/interview/chat`, params);
    return response.data;
  }
};
