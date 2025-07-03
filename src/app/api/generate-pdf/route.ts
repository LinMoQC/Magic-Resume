import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import chromium from '@sparticuz/chromium';

export async function POST(request: NextRequest) {
  try {
    const { html, options = {} } = await request.json();
    
    if (!html) {
      return NextResponse.json({ error: 'HTML content is required' }, { status: 400 });
    }

    // 根据环境选择Chrome执行路径和参数
    const isDev = process.env.NODE_ENV === 'development';
    const isVercel = process.env.VERCEL === '1';
    
    let executablePath: string | undefined;
    const baseArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ];

    let args: string[];
    if (isVercel || process.env.NODE_ENV === 'production') {
      // Vercel或生产环境：使用@sparticuz/chromium
      executablePath = await chromium.executablePath();
      args = [...baseArgs, ...chromium.args];
    } else if (isDev) {
      // 开发环境：尝试使用本地Chrome
      executablePath = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
      args = baseArgs;
    } else {
      args = baseArgs;
    }

    // 启动浏览器
    const browser = await puppeteer.launch({
      headless: true,
      args,
      executablePath,
    });

    const page = await browser.newPage();

    // 设置页面尺寸 - 先用较大的高度
    await page.setViewport({ 
      width: 794,  // A4宽度
      height: 5000, // 设置一个较大的初始高度
      deviceScaleFactor: 2 // 高分辨率
    });

    // 设置HTML内容
    await page.setContent(html, { 
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout: 30000 
    });

    // 等待字体加载完成
    await page.evaluateHandle('document.fonts.ready');

    // 检测内容的实际高度
    const contentInfo = await page.evaluate(() => {
      const resumeElement = document.getElementById('resume-to-export');
      if (resumeElement) {
        const rect = resumeElement.getBoundingClientRect();
        const scrollHeight = resumeElement.scrollHeight;
        const offsetHeight = resumeElement.offsetHeight;
        return {
          height: Math.max(scrollHeight, offsetHeight, rect.height),
          width: rect.width
        };
      } else {
        const bodyHeight = document.body.scrollHeight;
        return {
          height: bodyHeight,
          width: 794
        };
      }
    });

    // 计算PDF尺寸 - A4宽度，内容实际高度
    const a4WidthMm = 210; // A4宽度（毫米）
    const a4HeightMm = 297; // A4高度（毫米）
    
    // 像素转毫米的转换比例 (96 DPI standard)
    // 1 inch = 25.4 mm, 1 inch = 96 pixels
    // 所以 1 pixel = 25.4/96 mm ≈ 0.2646 mm
    const pixelToMm = 25.4 / 96;
    const contentHeightMm = contentInfo.height * pixelToMm;
    
    // 减少缓冲区，只添加必要的边距（上下各5mm）
    // 确保最小高度不小于A4标准高度
    const finalHeightMm = Math.max(contentHeightMm + 10, a4HeightMm);

    // 生成单页无限延长PDF
    const pdfBuffer = await page.pdf({
      width: `${a4WidthMm}mm`,
      height: `${finalHeightMm}mm`,
      printBackground: true,
      margin: {
        top: '5mm',
        right: '5mm', 
        bottom: '5mm',
        left: '5mm'
      },
      preferCSSPageSize: false,
      scale: 1.0,
      pageRanges: '1', // 强制只生成一页
      ...options 
    });

    await browser.close();

    // 返回PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="resume.pdf"',
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}