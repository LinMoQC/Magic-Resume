export async function POST(request: Request) {
  try {
    // 直接透传前端的 FormData（包含 file + config）给 Python 后端
    const formData = await request.formData();

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const backendResponse = await fetch(`${backendUrl}/api/pdf/parse`, {
      method: 'POST',
      body: formData,
    });

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
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
