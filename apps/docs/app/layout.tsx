import 'nextra-theme-docs/style.css'
import type { ReactNode } from 'react'

export const metadata = {
  title: { default: 'Magic Resume Docs', template: '%s – Magic Resume' },
  description: 'Documentation for Magic Resume — the AI-native resume platform.',
  metadataBase: new URL('https://docs.magic-resume.cn'),
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return children
}
