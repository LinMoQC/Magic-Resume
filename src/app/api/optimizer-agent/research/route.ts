// import { createResearchGraph } from "@/lib/aiLab/graphs";

// function streamResponse(iterator: AsyncGenerator<Record<string, unknown>>) {
//   const encoder = new TextEncoder();
//   const stream = new ReadableStream({
//     async pull(controller) {
//       try {
//         const { value, done } = await iterator.next();
        
//         if (done) {
//           controller.close();
//           return;
//         }

//         if (value) {
//           const chunk = typeof value === 'string' ? value : JSON.stringify(value);
//           controller.enqueue(encoder.encode(`data: ${chunk}\\n\\n`));
          
//           if (value['is_graph_complete']) {
//             controller.close();
//           }
//         }
//       } catch (error) {
//         console.error("Error during stream generation:", error);
//         controller.error(error);
//       }
//     },
//   });
//   return new Response(stream, {
//     headers: {
//       "Content-Type": "text/event-stream",
//       "Cache-Control": "no-cache",
//       "Connection": "keep-alive",
//     },
//   });
// }

export async function POST(request: Request) {
  try {
    const { resumeData, jd, config } = await request.json();

    if (!resumeData || !jd || !config) {
      return new Response(JSON.stringify({ error: "Missing resumeData, jd, or config" }), { status: 400 });
    }

    // const graph = createResearchGraph(config);
    // const stream = await graph.stream(
    //   {
    //     jd,
    //     resume: resumeData,
    //   },
    //   { recursionLimit: 25 }
    // );

    // return streamResponse(stream);

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
