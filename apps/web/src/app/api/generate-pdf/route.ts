import { NextRequest, NextResponse } from 'next/server';
import { getServerUserId } from '@/lib/auth/server';
import { serverFetchBackend } from '@/lib/auth/serverFetchBackend';

export const maxDuration = 60; // Set max duration to 60 seconds (or more if needed)

export async function POST(request: NextRequest) {
  try {
    const userId = await getServerUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const backendResponse = await serverFetchBackend('/api/pdf/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) {
        const errorText = await backendResponse.text();
        console.error('Backend API error:', backendResponse.status, errorText);
        return NextResponse.json(
            { error: 'Backend PDF generation failed', details: errorText },
            { status: backendResponse.status }
        );
    }

    // 获取二进制数据
    const pdfBuffer = await backendResponse.arrayBuffer();

    // 返回PDF流
    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="resume.pdf"',
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    });
    
  } catch (error) {
    console.error('PDF generation proxy error:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
