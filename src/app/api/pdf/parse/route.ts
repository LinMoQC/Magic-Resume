import { auth } from '@clerk/nextjs/server';

export async function POST(request: Request) {
  try {
    // 验证用户身份 — 未登录直接拒绝
    const { userId } = await auth();
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ─── 输入验证 ───
    const formData = await request.formData();

    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid "file" field.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 仅允许 PDF
    const allowedTypes = ['application/pdf'];
    if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.pdf')) {
      return new Response(
        JSON.stringify({ error: 'Only PDF files are accepted.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 文件大小限制: 10 MB
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ error: `File too large. Maximum size is 10MB, received ${(file.size / 1024 / 1024).toFixed(1)}MB.` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 只转发已验证的字段，不盲目透传整个 FormData
    const sanitizedFormData = new FormData();
    sanitizedFormData.append('file', file);
    const config = formData.get('config');
    if (config && typeof config === 'string') {
      sanitizedFormData.append('config', config);
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';

    // 设置 2 分钟超时，防止 LLM 解析无限挂起
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);

    const backendResponse = await fetch(`${backendUrl}/api/pdf/parse`, {
      method: 'POST',
      body: sanitizedFormData,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!backendResponse.ok) {
      const errorBody = await backendResponse.text();
      console.error(`[PDF_PARSE] Backend error: ${backendResponse.status} ${errorBody}`);
      return new Response(
        JSON.stringify({ error: `Backend error: ${errorBody}` }),
        { status: backendResponse.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await backendResponse.json();
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('[PDF_PARSE_API_ERROR]', error);

    // AbortError 说明超时
    if (error instanceof DOMException && error.name === 'AbortError') {
      return new Response(
        JSON.stringify({ error: 'PDF parsing timed out (120s). Please try again.' }),
        { status: 504, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
