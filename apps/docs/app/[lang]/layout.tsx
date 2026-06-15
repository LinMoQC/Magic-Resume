import { Layout, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import type { ReactNode } from 'react'

const LOCALES = [
  { locale: 'en', name: 'English' },
  { locale: 'zh', name: '中文' },
] as const

type Props = {
  children: ReactNode
  params: Promise<{ lang: string }>
}

const EDIT_LINK: Record<string, string> = {
  en: 'Edit this page on GitHub',
  zh: '在 GitHub 上编辑此页',
}

const FEEDBACK: Record<string, string> = {
  en: 'Question? Give us feedback',
  zh: '有问题？给我们反馈',
}

export default async function LangLayout({ children, params }: Props) {
  const { lang } = await params
  const pageMap = await getPageMap(`/${lang}`)
  return (
    <html lang={lang} dir="ltr" suppressHydrationWarning>
      <Head />
      <body>
        <Layout
          navbar={
            <Navbar
              logo={<b>Magic Resume</b>}
              projectLink="https://github.com/LinMoQC/Magic-Resume"
            />
          }
          pageMap={pageMap}
          docsRepositoryBase="https://github.com/LinMoQC/Magic-Resume/tree/master/apps/docs"
          footer={null}
          editLink={EDIT_LINK[lang] ?? EDIT_LINK.en}
          feedback={{ content: FEEDBACK[lang] ?? FEEDBACK.en }}
          i18n={[...LOCALES]}
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}
