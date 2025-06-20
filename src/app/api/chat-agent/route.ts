import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { messages, config} = body;

        // 转发请求到Python后端
        const backendUrl = `${process.env.BACKEND_URL}/api/chat`;

        const backendResponse = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages,
                config
            }),
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

            const readable = new ReadableStream({
                async start(controller) {
                    const reader = backendResponse.body!.getReader();
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
                    } catch (error) {
                        console.error('Stream error:', error);
                        controller.error(error);
                    } finally {
                        controller.close();
                    }
                }
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