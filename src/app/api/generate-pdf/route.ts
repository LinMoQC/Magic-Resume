import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';

export async function POST(request: NextRequest) {
  try {
    const { html, options = {} } = await request.json();

    if (!html) {
      return NextResponse.json({ error: 'HTML content is required' }, { status: 400 });
    }

    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    
    const baseArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
    ];

    let browser;
    if (isProduction) {
      // 使用 Browserless WebSocket 连接
      const browserWSEndpoint = `wss://production-sfo.browserless.io?token=${process.env.BROWSERLESS_TOKEN}`;

      browser = await puppeteer.connect({
        browserWSEndpoint,
        defaultViewport: null,  // 让浏览器不设置默认的视口
      });
    } else {
      // 本地环境使用本地 Chrome
      browser = await puppeteer.launch({
        headless: true,
        args: baseArgs,
        executablePath: process.env.CHROME_BIN || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
        timeout: 30000,
      });
    }

    const page = await browser.newPage();

    await page.setViewport({
      width: 794,  // A4宽度
      height: 5000, // 设置一个较大的初始高度
      deviceScaleFactor: 2, // 高分辨率
    });

    await page.setContent(html, {
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout: 30000,
    });

    await page.evaluateHandle('document.fonts.ready');

    const contentInfo = await page.evaluate(() => {
      const resumeElement = document.getElementById('resume-to-export');
      if (resumeElement) {
        const rect = resumeElement.getBoundingClientRect();
        const scrollHeight = resumeElement.scrollHeight;
        const offsetHeight = resumeElement.offsetHeight;
        return {
          height: Math.max(scrollHeight, offsetHeight, rect.height),
          width: rect.width,
        };
      } else {
        const bodyHeight = document.body.scrollHeight;
        return {
          height: bodyHeight,
          width: 794,
        };
      }
    });

    // 计算内容高度（毫米）并保证最小高度为 A4（297mm）
    const pixelToMm = 25.4 / 96;               // 96DPI 像素到毫米
    const contentHeightMm = contentInfo.height * pixelToMm;
    const finalHeightMm = Math.max(contentHeightMm + 10, 297); // 上下各留 5mm

    const pdfBuffer = await page.pdf({
      width: '210mm',
      height: `${finalHeightMm}mm`,
      printBackground: true,
      margin: { top: '5mm', right: '5mm', bottom: '5mm', left: '5mm' },
      ...options,
    });

    await browser.close();

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
