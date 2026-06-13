import { ApiResponse, httpClient } from './httpClient';
import { API_ROUTES } from './routes';

export type PersonalAccessToken = {
  id: string;
  name: string;
  tokenPrefix: string;
  tokenPreview: string;
  scopes: string[];
  lastUsedAt?: string | null;
  expiresAt?: string | null;
  revokedAt?: string | null;
  createdAt: string;
};

export type CreatedPersonalAccessToken = PersonalAccessToken & { token: string };

export type CreatePersonalAccessTokenRequest = {
  name: string;
  expiresAt?: string;
  scopes?: string[];
};

export const mcpApi = {
  /** 创建新的 Personal Access Token（返回值中含明文 token，仅显示一次） */
  createPersonalAccessToken: async (payload: CreatePersonalAccessTokenRequest): Promise<CreatedPersonalAccessToken> => {
    const response = await httpClient.api.post<ApiResponse<CreatedPersonalAccessToken>>(
      API_ROUTES.users.pats,
      payload,
    );
    return response.data.data;
  },

  /** 获取当前用户的所有 Personal Access Token 列表 */
  listPersonalAccessTokens: async (): Promise<PersonalAccessToken[]> => {
    const response = await httpClient.api.get<ApiResponse<PersonalAccessToken[]>>(
      API_ROUTES.users.pats,
    );
    return response.data.data;
  },

  /** 撤销指定 Personal Access Token，撤销后立即失效 */
  revokePersonalAccessToken: async (tokenId: string): Promise<PersonalAccessToken> => {
    const response = await httpClient.api.patch<ApiResponse<PersonalAccessToken>>(
      API_ROUTES.users.patRevoke(tokenId),
      {},
    );
    return response.data.data;
  },
};
