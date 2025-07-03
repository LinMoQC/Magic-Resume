import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(request: NextRequest) {
  try {
    const { html, options = {} } = await request.json();
    
    if (!html) {
      return NextResponse.json({ error: 'HTML content is required' }, { status: 400 });
    }

    console.log('收到PDF生成请求，HTML长度:', html.length);

    // 启动浏览器（使用系统Chrome或下载的Chrome）
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process', // 这个在某些环境下需要
        '--disable-gpu'
      ],
      // 尝试使用系统Chrome
      executablePath: process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    });

    const page = await browser.newPage();
    
    // 监听浏览器控制台输出
    page.on('console', (msg) => {
      console.log('浏览器输出:', msg.text());
    });

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
      console.log('开始检测简历内容...');
      const resumeElement = document.getElementById('resume-to-export');
      if (resumeElement) {
        const rect = resumeElement.getBoundingClientRect();
        const scrollHeight = resumeElement.scrollHeight;
        const offsetHeight = resumeElement.offsetHeight;
        console.log('找到简历元素');
        console.log('scrollHeight:', scrollHeight);
        console.log('offsetHeight:', offsetHeight);
        console.log('getBoundingClientRect高度:', rect.height);
        console.log('简历元素innerHTML长度:', resumeElement.innerHTML.length);
        return {
          height: Math.max(scrollHeight, offsetHeight, rect.height),
          width: rect.width
        };
      } else {
        console.log('未找到简历元素，使用body高度');
        const bodyHeight = document.body.scrollHeight;
        console.log('body内容:', document.body.innerHTML.substring(0, 200) + '...');
        console.log('body scrollHeight:', bodyHeight);
        return {
          height: bodyHeight,
          width: 794
        };
      }
    });

    console.log('Node.js: 检测到的内容信息:', contentInfo);

    // 计算PDF尺寸 - A4宽度，内容实际高度
    const a4WidthMm = 210; // A4宽度（毫米）
    
    // 像素转毫米的转换比例 (96 DPI standard)
    // 1 inch = 25.4 mm, 1 inch = 96 pixels
    // 所以 1 pixel = 25.4/96 mm ≈ 0.2646 mm
    const pixelToMm = 25.4 / 96;
    const contentHeightMm = contentInfo.height * pixelToMm;
    
    // 减少缓冲区，只添加必要的边距（上下各5mm）
    const finalHeightMm = contentHeightMm + 10;
    
    console.log(`内容高度: ${contentInfo.height}px`);
    console.log(`转换为毫米: ${contentHeightMm.toFixed(2)}mm`);
    console.log(`最终PDF高度: ${finalHeightMm.toFixed(2)}mm`);
    console.log(`PDF尺寸: ${a4WidthMm}mm x ${finalHeightMm.toFixed(2)}mm`);

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

    console.log('PDF生成成功，大小:', pdfBuffer.length, 'bytes');
    console.log('单页无限延长PDF已生成');

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