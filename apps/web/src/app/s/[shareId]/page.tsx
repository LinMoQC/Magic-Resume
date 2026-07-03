import type { Metadata } from 'next';
import SharedResumeClient from './_components/SharedResumeClient';
import { resumeApi } from '@/lib/api/resume';

interface Props {
  params: Promise<{ shareId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shareId } = await params;
  
  try {
    const data = await resumeApi.fetchSharedResume(shareId);
    if (data) {
        let resumeName = data.name || '';
        if (!resumeName && typeof data.content === 'string') {
            try {
                const content = JSON.parse(data.content);
                resumeName = content.name;
            } catch {
                // Ignore parsing errors
            }
        }
        
        const title = resumeName ? `${resumeName}'s Resume` : 'Magic Resume';
        const description = `查看 ${resumeName || ''} 开发的高质量简历。`;
        const image = { url: '/magic-resume-preview.png', width: 1200, height: 630 };
        return {
            title,
            description,
            openGraph: {
                title,
                description,
                type: 'profile',
                url: `/s/${shareId}`,
                siteName: 'Magic Resume',
                images: [image],
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                images: [image.url],
            },
        };
    }
  } catch (error) {
    console.error('Error generating metadata:', error);
  }

  return {
    title: 'Magic Resume',
    description: 'Magic Resume - AI 智能简历制作器',
    openGraph: {
      title: 'Magic Resume',
      description: 'Magic Resume - AI 智能简历制作器',
      type: 'website',
      url: `/s/${shareId}`,
      siteName: 'Magic Resume',
      images: [{ url: '/magic-resume-preview.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Magic Resume',
      description: 'Magic Resume - AI 智能简历制作器',
      images: ['/magic-resume-preview.png'],
    },
  };
}

export default function SharedResumePage() {
  return <SharedResumeClient />;
}
