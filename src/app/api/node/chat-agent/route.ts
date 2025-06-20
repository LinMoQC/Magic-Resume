import { NextRequest, NextResponse } from 'next/server';
import { initialResume } from '@/store/useResumeStore';
import { createResumeChatAgent } from '@/lib/aiLab/agents';
import { AIMessage, HumanMessage } from '@langchain/core/messages';

export async function POST(req: NextRequest) {
    try {
        const { messages, config } = await req.json();

        const chatAgent = createResumeChatAgent(config);

        const history = messages.slice(0, -1).map((msg: { role: 'user' | 'ai'; content: string; }) => 
            msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content)
        );
        
        const lastUserMessage = messages[messages.length - 1].content;

        const stream = await chatAgent.stream({
            input: lastUserMessage,
            chat_history: history,
            resume_draft: JSON.stringify(initialResume, null, 2),
        });

        const encoder = new TextEncoder();

        const readableStream = new ReadableStream({
            async start(controller) {
                let buffer = '';
                let responseStarted = false;

                // This regex helps to find the start of a meaningful response,
                // ignoring potential XML tags and the [RESPONSE] marker itself.
                const findResponseStart = (str: string): number => {
                    const responseTagIndex = str.indexOf('[RESPONSE]');
                    if (responseTagIndex !== -1) {
                        return responseTagIndex + '[RESPONSE]'.length;
                    }
                    
                    // Look for the start of actual text, ignoring whitespace and XML-like tags
                    const match = str.match(/(?:<\/?[^>]+>|\s)*([a-zA-Z\u4e00-\u9fa5])/);
                    return match ? match.index! + match[0].length - 1 : -1;
                };

                for await (const chunk of stream) {
                    const content = chunk.content;
                    if (typeof content !== 'string') continue;

                    if (!responseStarted) {
                        buffer += content;
                        const startIndex = findResponseStart(buffer);
                        if (startIndex !== -1) {
                            responseStarted = true;
                            const meaningfulContent = buffer.substring(startIndex);
                            if (meaningfulContent) {
                                const data = { type: 'message_chunk', content: meaningfulContent };
                                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\\n\\n`));
                            }
                        }
                    } else {
                        // Once started, just stream the content directly
                        const data = { type: 'message_chunk', content };
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\\n\\n`));
                    }
                }
                // NOTE: The [RESUME] block logic is removed for simplification
                // as the primary issue is getting the chat stream to work reliably.
                controller.close();
            },
        });

        console.log(readableStream)

        return new Response(readableStream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error: unknown) {
        console.log(error)
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return new NextResponse(
            JSON.stringify({ 
                error: 'An error occurred.', 
                errorMessage: errorMessage 
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
} 
