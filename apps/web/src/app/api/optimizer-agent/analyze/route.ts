import { getServerUserId } from '@/lib/auth/server';
import { serverFetchBackend } from '@/lib/auth/serverFetchBackend';

export async function POST(request: Request) {
  try {
    const userId = await getServerUserId();
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { state, config } = await request.json();

    if (!state || !config) {
      return new Response(JSON.stringify({ error: "Missing state or config" }), { status: 400 });
    }

    const backendResponse = await serverFetchBackend('/api/graph/analyze', {
      method: 'POST',
      body: JSON.stringify({ state, config }),
    });

    console.log("[BACKEND_RESPONSE]");

    if (!backendResponse.ok) {
      const errorBody = await backendResponse.text();
      console.error(`Backend error: ${backendResponse.status} ${errorBody}`);
      return new Response(JSON.stringify({ error: `Backend error: ${errorBody}` }), { status: backendResponse.status });
    }

    if (!backendResponse.body) {
      return new Response(JSON.stringify({ error: "No response body from backend" }), { status: 500 });
    }

    return new Response(backendResponse.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });

  } catch (error: unknown) {
    console.error("[ANALYZE_GRAPH_API_ERROR]", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    const errorResponse = { error: errorMessage };
    return new Response(JSON.stringify(errorResponse), { status: 500 });
  }
}
