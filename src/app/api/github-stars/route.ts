import { NextResponse } from 'next/server';

// Set revalidation time to 1 hour (3600 seconds)
export const revalidate = 3600;

export async function GET() {
  try {
    const htmlResponse = await fetch('https://github.com/LinMoQC/Magic-Resume', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Magic-Resume-App/1.0)',
      },
      next: { revalidate: 3600 }
    });

    if (!htmlResponse.ok) {
        throw new Error(`GitHub page fetch failed: ${htmlResponse.statusText}`);
    }

    const html = await htmlResponse.text();
    const starMatch = html.match(/href=".*?\/stargazers"[\s\S]*?<strong>\s*([\d,.]+[kK]?)\s*<\/strong>/);

    if (starMatch && starMatch[1]) {
        let starStr = starMatch[1].trim().replace(/,/g, '');
        let multiplier = 1;
        if (starStr.toLowerCase().endsWith('k')) {
            multiplier = 1000;
            starStr = starStr.slice(0, -1);
        }
        
        const stars = Math.floor(parseFloat(starStr) * multiplier);
        if (!isNaN(stars)) {
            return NextResponse.json({ stars });
        }
    }
    
    const ariaMatch = html.match(/aria-label="([\d,.]+) users starred this repository"/);
    if (ariaMatch && ariaMatch[1]) {
         const stars = parseInt(ariaMatch[1].replace(/,/g, ''), 10);
         if (!isNaN(stars)) {
             return NextResponse.json({ stars });
         }
    }

    throw new Error('Could not parse stars from HTML');

  } catch (error) {
    console.error('Failed to fetch stars:', error);
    // Return a default error response
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 