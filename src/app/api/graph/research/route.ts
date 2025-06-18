import { createResearchGraph } from "@/lib/aiLab/graphs";

function streamResponse(iterator: AsyncGenerator<Record<string, unknown>>) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next();
      if (done) {
        controller.close();
      } else {
        const chunk = typeof value === 'string' ? value : JSON.stringify(value);
        controller.enqueue(encoder.encode(`data: ${chunk}\\n\\n`));
      }
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

export async function POST(request: Request) {
  try {
    const { resumeData, jd, config } = await request.json();

    if (!resumeData || !jd || !config) {
      return new Response(JSON.stringify({ error: "Missing resumeData, jd, or config" }), { status: 400 });
    }

    const graph = createResearchGraph(config);
    const stream = await graph.stream(
      {
        jd,
        resume: resumeData,
      },
      { recursionLimit: 25 }
    );

    return streamResponse(stream);

  } catch (error: unknown) {
    console.error("[RESEARCH_GRAPH_API_ERROR]", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    const errorResponse = { error: errorMessage };
    return new Response(JSON.stringify(errorResponse), { status: 500 });
  }
}
