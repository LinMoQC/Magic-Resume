import { httpClient, type ApiResponse } from './httpClient';
import { API_ROUTES } from './routes';

/**
 * 内容中心公开读（docs/specs/knowledge-base P1/P2A）。这些端点匿名可访问：
 * 登录时 axios 拦截器会带上 token，但服务端不要求。只返回 published 内容。
 */

export interface PublicTimeline {
  id: string;
  company: string;
  season: string;
  stage: string;
  title: string;
  openAt?: string;
  deadlineAt?: string;
  region?: string;
  industry?: string;
  roleTags: string[];
  sourceName: string;
  sourceUrl: string;
}

export interface PublicQa {
  id: string;
  question: string;
  answer: string;
  role: string;
  company?: string;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  sourceName: string;
  sourceUrl: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  current: number;
  size: number;
}

export interface TimelineListParams {
  current?: number;
  size?: number;
  season?: string;
  industry?: string;
  region?: string;
  role?: string;
}

export interface QaListParams {
  current?: number;
  size?: number;
  q?: string;
  role?: string;
  company?: string;
  tags?: string; // 逗号分隔，服务端拆分
  difficulty?: string;
}

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : '';
}

export async function fetchTimelines(
  params: TimelineListParams,
): Promise<Paginated<PublicTimeline>> {
  const response = await httpClient.api.get<ApiResponse<Paginated<PublicTimeline>>>(
    `${API_ROUTES.knowledge.timelines}${query({ ...params })}`,
  );
  return response.data.data;
}

export async function fetchQaLibrary(
  params: QaListParams,
): Promise<Paginated<PublicQa>> {
  const response = await httpClient.api.get<ApiResponse<Paginated<PublicQa>>>(
    `${API_ROUTES.knowledge.qa}${query({ ...params })}`,
  );
  return response.data.data;
}
