import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const maxDuration = 60; // Set max duration to 60 seconds (or more if needed)

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // 获取后端地址，优先使用环境变量，否则回退到本地默认
    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
      console.warn('BACKEND_URL not set, defaulting to http://127.0.0.1:8000');
    }

    console.log('Backend URL:', backendUrl);
    
    const apiUrl = `${backendUrl || 'http://127.0.0.1:8000'}/api/pdf/generate`;
    console.log('Proxying PDF generation to:', apiUrl);

    const backendResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
