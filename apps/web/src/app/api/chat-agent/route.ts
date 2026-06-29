import { NextRequest, NextResponse } from 'next/server';
import { getServerUserId } from '@/lib/auth/server';
import { serverFetchBackend } from '@/lib/auth/serverFetchBackend';

export async function POST(req: NextRequest) {
    try {
        const userId = await getServerUserId();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();

        // 转发到 agent-service（单一 origin + 带 Clerk token）；整包透传（含 mode / currentResume）。
        // 透传 req.signal：浏览器中断 / 关窗导致客户端断连时，上游到 agent-service 的 fetch 一并 abort，
        // 后端据此停止 LangGraph 生成（不再空烧用户 BYOK token）。
        const backendResponse = await serverFetchBackend('/api/chat', {
            method: 'POST',
            body: JSON.stringify(body),
            signal: req.signal,
        });

        if (!backendResponse.ok) {
            const errorText = await backendResponse.text();
            throw new Error(`Backend responded with status: ${backendResponse.status}, body: ${errorText}`);
        }

        // 检查响应是否为流式
        const contentType = backendResponse.headers.get('content-type');
        
        if (contentType && contentType.includes('text/event-stream')) {
            // 流式响应 - 手动转发以确保流式行为
            if (!backendResponse.body) {
                throw new Error('No response body');
            }

            // Hoisted so cancel() can tear down the upstream read when the client
            // disconnects (closed modal / stop), closing the agent-service socket.
            let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
            const readable = new ReadableStream({
                async start(controller) {
                    reader = backendResponse.body!.getReader();
                    const decoder = new TextDecoder();
                    let buffer = '';

                    try {
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;

                            // 解码数据并按行分割
                            const text = decoder.decode(value, { stream: true });
                            buffer += text;

                            // 处理完整的lines
                            const lines = buffer.split('\n');
                            buffer = lines.pop() || ''; // 保留最后一个可能不完整的行

                            for (const line of lines) {
                                if (line.trim()) {
                                    // 立即发送每一行
                                    const chunk = new TextEncoder().encode(line + '\n');
                                    controller.enqueue(chunk);
                                }
                            }
                        }

                        // 发送剩余的buffer
                        if (buffer.trim()) {
                            const chunk = new TextEncoder().encode(buffer);
                            controller.enqueue(chunk);
                        }
                        controller.close();
                    } catch (error) {
                        // A client/upstream abort surfaces as AbortError once req.signal
                        // fires — that's an expected cancel, not a stream failure.
                        if ((error as Error)?.name === 'AbortError') {
                            controller.close();
                        } else {
                            console.error('Stream error:', error);
                            controller.error(error);
                        }
                    }
                },
                cancel(reason) {
                    // Consumer (browser) cancelled: release the upstream read so the
                    // agent-service request socket closes and its run is aborted.
                    reader?.cancel(reason).catch(() => {});
                },
            });

            return new Response(readable, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                },
            });
        } else {
            // 非流式响应 - 直接返回JSON
            const data = await backendResponse.json();
            return NextResponse.json(data);
        }

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        return NextResponse.json(
            { 
                error: 'API转发失败', 
                errorMessage: errorMessage
            },
            { status: 500 }
        );
    }
}
