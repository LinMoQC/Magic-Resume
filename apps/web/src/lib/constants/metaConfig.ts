import { Metadata } from "next";

// 元信息配置
const metaConfig: { [key: string]: Metadata } = {
  'Landing': {
    title: {
      default: "Magic Resume - AI智能简历制作器 | 免费在线简历生成器",
      template: `%s | Magic Resume - AI智能简历制作`,
    },
    description: "Magic Resume是一款免费的AI驱动智能简历制作器。提供精美简历模板，AI简历优化，一键生成专业简历。支持中英文，适合程序员、产品经理、设计师等各行业求职者。",
    keywords: [
      "AI简历制作", "智能简历生成器", "免费简历制作", "在线简历编辑器", 
      "简历模板", "简历优化", "AI简历", "程序员简历", "产品经理简历",
      "resume builder", "AI resume", "free resume maker", "cv maker",
      "简历生成器", "求职简历", "简历设计", "简历下载", "简历导出"
    ],
    openGraph: {
      title: "Magic Resume - AI智能简历制作器 | 免费专业简历生成",
      description: "使用AI技术，3分钟制作专业简历。提供50+精美模板，智能内容优化，支持PDF导出。已帮助10万+用户成功求职。",
      url: "https://magic-resume.cn", 
      siteName: "Magic Resume",
      locale: 'zh_CN',
      type: 'website',
      images: [
        {
          url: '/magic-resume-preview.png',
          width: 1200,
          height: 630,
          alt: 'Magic Resume - AI智能简历制作器'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Magic Resume - AI智能简历制作器',
      description: '免费AI驱动的专业简历制作工具，3分钟生成精美简历',
      images: ['/magic-resume-preview.png'],
      creator: '@MagicResume'
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: "your-google-verification-code",
      yandex: "your-yandex-verification-code"
    },
    alternates: {
      canonical: 'https://magic-resume.cn',
      languages: {
        'zh-CN': 'https://magic-resume.cn/zh',
        'en-US': 'https://magic-resume.cn/en',
      },
    },
  },
  // 以下页面配置在实际开发时再启用
  // 'Templates': {
  //   title: "简历模板 - 50+精美专业简历模板免费下载 | Magic Resume",
  //   description: "Magic Resume提供50+精美简历模板，涵盖程序员、产品经理、设计师、销售等各行业。支持在线编辑，一键下载PDF。全部免费使用。",
  //   keywords: ["简历模板", "免费简历模板", "简历模板下载", "专业简历模板"],
  //   openGraph: {
  //     title: "50+精美简历模板免费下载 - Magic Resume",
  //     description: "涵盖各行业的专业简历模板，在线编辑，一键下载PDF",
  //     images: ['/templates-preview.png']
  //   }
  // },
  'Dashboard': {
    title: "我的简历 - 简历管理中心 | Magic Resume",
    description: "管理您的所有简历，查看简历数据分析，使用AI优化工具提升简历质量。",
    robots: {
      index: false,
      follow: false,
    },
  },
  'Edit': {
    title: "编辑简历 - 在线简历编辑器 | Magic Resume",
    description: "使用Magic Resume强大的在线编辑器，实时预览简历效果，AI智能优化内容。",
    robots: {
      index: false,
      follow: false,
    },
  },
};

export default metaConfig;
