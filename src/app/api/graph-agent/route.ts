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
                let resumeStarted = false;

                for await (const chunk of stream) {
                    const content = chunk.content;
                    if (typeof content !== 'string') continue;

                    buffer += content;

                    if (!responseStarted && buffer.includes('[RESPONSE]')) {
                        const parts = buffer.split('[RESPONSE]');
                        buffer = parts[1] || '';
                        responseStarted = true;
                    }

                    if (responseStarted && buffer.includes('[RESUME]')) {
                        const parts = buffer.split('[RESUME]');
                        const responseChunk = parts[0];
                        buffer = parts[1] || '';
                        resumeStarted = true;

                        if (responseChunk) {
                            const data = `data: ${JSON.stringify({ type: 'message_chunk', content: responseChunk })}\\n\\n`;
                            controller.enqueue(encoder.encode(data));
                        }
                    }

                    if (responseStarted && !resumeStarted) {
                        const data = `data: ${JSON.stringify({ type: 'message_chunk', content: buffer })}\\n\\n`;
                        controller.enqueue(encoder.encode(data));
                        buffer = '';
                    }
                }

                if (resumeStarted && buffer.trim()) {
                    try {
                        const resumeJson = JSON.parse(buffer.trim());
                        const data = `data: ${JSON.stringify({ type: 'resume_update', data: resumeJson })}\\n\\n`;
                        controller.enqueue(encoder.encode(data));
                    } catch {
                        console.error('Failed to parse final resume JSON:', buffer.trim());
                    }
                }

                controller.close();
            },
        });

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
