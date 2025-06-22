export async function POST(request: Request) {
  try {
    const { resumeData, jd, config } = await request.json();

    if (!resumeData || !jd || !config) {
      return new Response(JSON.stringify({ error: "Missing resumeData, jd, or config" }), { status: 400 });
    }

    const backendUrl = process.env.BACKEND_URL;
    const backendResponse = await fetch(`${backendUrl}/api/graph/research`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ resumeData, jd, config }),
    });

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
    console.error("[RESEARCH_GRAPH_API_ERROR]", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    const errorResponse = { error: errorMessage };
    return new Response(JSON.stringify(errorResponse), { status: 500 });
  }
}
