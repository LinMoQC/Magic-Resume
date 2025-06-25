import Script from 'next/script'

interface StructuredDataProps {
  type: 'website' | 'article' | 'product' | 'organization' | 'faq' | 'howto'
  data?: Record<string, any>
}

export default function StructuredData({ type, data = {} }: StructuredDataProps) {
  const getSchemaData = () => {
    const baseUrl = 'https://magic-resume.cn'
    
    switch (type) {
      case 'website':
        return {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Magic Resume",
          "alternateName": "魔法简历",
          "url": baseUrl,
          "description": "AI驱动的智能简历制作器，提供免费专业简历模板和AI优化服务",
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": `${baseUrl}/search?q={search_term_string}`
            },
            "query-input": "required name=search_term_string"
          },
          "sameAs": [
            "https://github.com/magic-resume",
            "https://twitter.com/MagicResume",
            "https://linkedin.com/company/magic-resume"
          ]
        }

      case 'organization':
        return {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Magic Resume",
          "alternateName": "魔法简历",
          "url": baseUrl,
          "logo": `${baseUrl}/magic-resume-logo.png`,
          "description": "专业的AI简历制作平台，帮助求职者制作完美简历",
          "foundingDate": "2024",
          "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer service",
            "email": "support@magic-resume.cn",
            "availableLanguage": ["Chinese", "English"]
          },
          "sameAs": [
            "https://github.com/magic-resume",
            "https://twitter.com/MagicResume"
          ],
          "knowsAbout": [
            "简历制作", "AI简历优化", "求职指导", "职业规划",
            "简历模板", "Resume Writing", "Career Coaching"
          ]
        }

      case 'product':
        return {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Magic Resume",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web Browser",
          "description": "免费的AI驱动智能简历制作器，帮助用户快速制作专业简历",
          "url": baseUrl,
          "screenshot": `${baseUrl}/magic-resume-preview.png`,
          "softwareVersion": "2.0",
          "datePublished": "2024-01-01",
          "author": {
            "@type": "Organization", 
            "name": "Magic Resume Team"
          },
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "CNY",
            "availability": "https://schema.org/InStock",
            "priceValidUntil": "2025-12-31"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "reviewCount": "500",
            "bestRating": "5",
            "worstRating": "1"
          },
          "featureList": [
            "AI智能简历分析和优化",
            "多种专业简历模板", 
            "实时预览编辑功能",
            "PDF等多格式导出",
            "完全免费使用",
            "数据本地存储保护隐私"
          ],
          "keywords": "AI简历制作,免费简历制作器,智能简历生成器,在线简历编辑,简历优化工具"
        }

      case 'faq':
        return {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Magic Resume是免费的吗？",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "是的，Magic Resume完全免费使用。我们提供所有核心功能，包括AI分析、模板使用和PDF导出，无需付费。"
              }
            },
            {
              "@type": "Question", 
              "name": "AI简历分析准确吗？",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "我们的AI基于大量优秀简历数据训练，能够准确分析简历的关键词匹配度、格式规范性和内容完整性，准确率达到90%以上。"
              }
            },
            {
              "@type": "Question",
              "name": "简历数据是否安全？",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "绝对安全。所有简历数据采用本地存储，我们不会收集或存储您的个人信息。您的隐私是我们的首要关注。"
              }
            },
            {
              "@type": "Question",
              "name": "支持哪些导出格式？",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "支持PDF、Word、PNG等多种格式导出，确保在不同场景下都能完美展示您的简历。"
              }
            }
          ]
        }

      case 'howto':
        return {
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "如何使用Magic Resume制作专业简历",
          "description": "完整指南：使用AI技术制作专业简历的详细步骤",
          "image": `${baseUrl}/howto-guide.png`,
          "totalTime": "PT10M",
          "estimatedCost": {
            "@type": "MonetaryAmount",
            "currency": "CNY",
            "value": "0"
          },
          "step": [
            {
              "@type": "HowToStep",
              "name": "选择模板",
              "text": "从50+精美模板中选择最适合您行业的简历模板",
              "image": `${baseUrl}/step1-template.png`
            },
            {
              "@type": "HowToStep", 
              "name": "填写信息",
              "text": "填写个人信息、工作经验、教育背景等基本内容",
              "image": `${baseUrl}/step2-info.png`
            },
            {
              "@type": "HowToStep",
              "name": "AI优化",
              "text": "使用AI分析功能获得专业优化建议，提升简历质量",
              "image": `${baseUrl}/step3-ai.png`
            },
            {
              "@type": "HowToStep",
              "name": "导出简历",
              "text": "选择合适的格式导出您的专业简历",
              "image": `${baseUrl}/step4-export.png`
            }
          ]
        }

      case 'article':
        return {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": data.title || "Magic Resume使用指南",
          "description": data.description || "详细的简历制作指南和技巧分享",
          "image": data.image || `${baseUrl}/article-default.png`,
          "author": {
            "@type": "Organization",
            "name": "Magic Resume"
          },
          "publisher": {
            "@type": "Organization",
            "name": "Magic Resume",
            "logo": {
              "@type": "ImageObject",
              "url": `${baseUrl}/magic-resume-logo.png`
            }
          },
          "datePublished": data.publishDate || new Date().toISOString(),
          "dateModified": data.modifyDate || new Date().toISOString(),
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": data.url || baseUrl
          }
        }

      default:
        return null
    }
  }

  const schemaData = getSchemaData()
  
  if (!schemaData) return null

  return (
    <Script
      id={`structured-data-${type}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schemaData)
      }}
    />
  )
} 