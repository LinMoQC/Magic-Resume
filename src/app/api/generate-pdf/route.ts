import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';

export async function POST(request: NextRequest) {
  try {
    const { html, options = {}, width = 794, height = 1000 } = await request.json();

    if (!html) {
      return NextResponse.json({ error: 'HTML content is required' }, { status: 400 });
    }

    let browser;
    const token = process.env.BROWSERLESS_TOKEN;

    if (token) {
      // 生产环境或已配置 Token：使用 Browserless WebSocket 连接
      console.log(token);
      const browserWSEndpoint = `wss://production-sfo.browserless.io?token=${token}`;
      browser = await puppeteer.connect({
        browserWSEndpoint,
        defaultViewport: null,
      });
    } else {
      // 本地开发环境：尝试启动本地 Chrome
      // 常见操作系统 Chrome 路径
      const executablePaths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // macOS
        '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary', // macOS Canary
        '/usr/bin/google-chrome', // Linux
        '/usr/bin/chromium', // Linux
        '/usr/bin/chromium-browser', // Linux
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Windows 64-bit
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe', // Windows 32-bit
      ];

      const fs = require('fs');
      const foundPath = executablePaths.find(p => fs.existsSync(p));

      if (!foundPath) {
        throw new Error('未找到本地 Chrome 安装，且未配置 BROWSERLESS_TOKEN。请安装 Chrome 或配置环境变量。');
      }

      console.log('正在使用本地 Chrome启动:', foundPath);
      browser = await puppeteer.launch({
        executablePath: foundPath,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: null,
      });
    }

    const page = await browser.newPage();

    // 设置初始视口
    await page.setViewport({
      width: width,
      height: height,
      deviceScaleFactor: 1,
    });

    await page.setContent(html, {
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout: 30000,
    });

    await page.evaluateHandle('document.fonts.ready');

    // 获取内容信息
    const contentInfo = await page.evaluate((defaultWidth) => {
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
          width: defaultWidth,
        };
      }
    }, width);

    // 根据内容重新调整视口高度，确保完全捕获内容
    if (contentInfo.height > height) {
      await page.setViewport({
        width: width,
        height: contentInfo.height,
        deviceScaleFactor: 1,
      });
    }

    // 直接使用像素单位，无需转换
    const finalWidth = contentInfo.width;
    const finalHeight = contentInfo.height;

    const pdfBuffer = await page.pdf({
      width: `${finalWidth}px`,
      height: `${finalHeight}px`,
      printBackground: true,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
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
