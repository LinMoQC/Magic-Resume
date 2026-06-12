import { ApiResponse, httpClient, withAuth } from './httpClient';

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

export type CreatedPersonalAccessToken = PersonalAccessToken & {
  token: string;
};

export type CreatePersonalAccessTokenRequest = {
  name: string;
  expiresAt?: string;
  scopes?: string[];
};

export const mcpApi = {
  createPersonalAccessToken: async (payload: CreatePersonalAccessTokenRequest, token: string) => {
    const response = await httpClient.api.post<ApiResponse<CreatedPersonalAccessToken>>(
      '/api/users/me/personal-access-tokens',
      payload,
      withAuth(token),
    );

    return response.data.data;
  },

  listPersonalAccessTokens: async (token: string) => {
    const response = await httpClient.api.get<ApiResponse<PersonalAccessToken[]>>(
      '/api/users/me/personal-access-tokens',
      withAuth(token),
    );

    return response.data.data;
  },

  revokePersonalAccessToken: async (tokenId: string, token: string) => {
    const response = await httpClient.api.patch<ApiResponse<PersonalAccessToken>>(
      `/api/users/me/personal-access-tokens/${tokenId}/revoke`,
      {},
      withAuth(token),
    );

    return response.data.data;
  },
};
