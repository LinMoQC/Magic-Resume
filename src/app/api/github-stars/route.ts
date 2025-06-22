import { NextResponse } from 'next/server';

export const revalidate = 3600;

export async function GET() {
  try {
    const response = await fetch('https://api.github.com/repos/LinMoQC/Magic-Resume', {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Magic-Resume-App', 
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('GitHub API Error:', errorData);
      return NextResponse.json({ error: `GitHub API error: ${errorData.message}` }, { status: response.status });
    }

    const data = await response.json();
    const stars = data.stargazers_count;

    if (typeof stars !== 'number') {
        return NextResponse.json({ error: 'stargazers_count not found in response' }, { status: 500 });
    }

    return NextResponse.json({ stars });
  } catch (error) {
    console.error('Failed to fetch stars:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 