export type MagicResumeApiClientOptions = {
  apiUrl: string;
  token: string;
};

export type MagicResumeApiClient = {
  listResumes: () => Promise<unknown>;
  getResume: (resumeId: string) => Promise<unknown>;
  updateResume: (resumeId: string, input: unknown) => Promise<unknown>;
};

export function createApiClient(options: MagicResumeApiClientOptions): MagicResumeApiClient {
  const baseUrl = options.apiUrl.replace(/\/$/, '');

  async function request(path: string, init: RequestInit = {}): Promise<unknown> {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${options.token}`,
        'Content-Type': 'application/json',
        ...init.headers,
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Magic Resume API request failed: ${response.status} ${response.statusText}${body ? ` - ${body}` : ''}`);
    }

    return response.json();
  }

  return {
    listResumes: () => request('/resumes/mine'),
    getResume: (resumeId: string) => request(`/resumes/${resumeId}`),
    updateResume: (resumeId: string, input: unknown) => request(`/resumes/${resumeId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  };
}
