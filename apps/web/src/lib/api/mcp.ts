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
  createPersonalAccessToken: async (payload: CreatePersonalAccessTokenRequest) => {
    const response = await httpClient.api.post<ApiResponse<CreatedPersonalAccessToken>>(
      API_ROUTES.users.pats,
      payload,
    );
    return response.data.data;
  },

  listPersonalAccessTokens: async () => {
    const response = await httpClient.api.get<ApiResponse<PersonalAccessToken[]>>(
      API_ROUTES.users.pats,
    );
    return response.data.data;
  },

  revokePersonalAccessToken: async (tokenId: string) => {
    const response = await httpClient.api.patch<ApiResponse<PersonalAccessToken>>(
      API_ROUTES.users.patRevoke(tokenId),
      {},
    );
    return response.data.data;
  },
};
