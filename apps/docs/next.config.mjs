import nextra from 'nextra'

const withNextra = nextra({
  defaultShowCopyCode: true,
})

export default withNextra({
  i18n: {
    locales: ['en', 'zh'],
    defaultLocale: 'en',
  },
})
