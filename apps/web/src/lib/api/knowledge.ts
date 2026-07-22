import { httpClient, type ApiResponse } from './httpClient';
import { API_ROUTES } from './routes';

/**
 * 校招时间线公开读（docs/specs/knowledge-base P1/P2A）。该端点匿名可访问：
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
  logoUrl?: string;
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
