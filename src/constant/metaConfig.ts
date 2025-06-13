import { Metadata } from "next";

// 元信息配置
const metaConfig: { [key: string]: Metadata } = {
  'Landing': {
    title: {
      default: "Magic Resume - AI 驱动的现代化智能简历构建器",
      template: `%s | Magic Resume`,
    },
    description: "使用 Magic Resume 在几分钟内创建一份专业的现代化简历。我们由 AI 驱动的简历构建器可以帮助您在求职中脱颖而出，获得理想工作。",
    keywords: ["简历制作", "AI简历", "在线简历", "专业简历", "求职", "CV制作", "resume builder", "AI resume"],
    openGraph: {
      title: "Magic Resume - AI 驱动的现代化智能简历构建器",
      description: "使用我们由 AI 驱动的简历构建器，在几分钟内创建一份专业的现代化简历。",
      url: "https://magic-resume.cn", 
      siteName: "Magic Resume",
      locale: 'zh_CN',
      type: 'website',
    },
  },
  'Dashboard': {
    title: "仪表盘 - Magic Resume",
    description: "管理您的所有简历、查看数据并使用所有编辑工具。",
    robots: {
      index: false,
      follow: false,
    },
  },
  'Edit': {
    title: "编辑简历 - Magic Resume",
    description: "使用我们强大的编辑器微调您的简历。",
    robots: {
      index: false,
      follow: false,
    },
  },
};
export default metaConfig;
