// @ts-check

import { defineConfig } from 'astro/config'

// Adapter
// 1. Vercel (serverless)
import vercelServerless from '@astrojs/vercel/serverless'
// 2. Vercel (static)
// import vercelStatic from '@astrojs/vercel/static';
// 3. Local (standalone)
// import node from '@astrojs/node'
// ---

// Integrations
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import tailwind from '@astrojs/tailwind'
import icon from 'astro-icon'
// Markdown
import { remarkReadingTime, remarkGithubCards, remarkArxivCards } from './src/utils/remarkPlugins.ts'
import rehypeExternalLinks from 'rehype-external-links'
import rehypeKatex from 'rehype-katex'
import { remarkAlert } from 'remark-github-blockquote-alert'
import remarkMath from 'remark-math'
import { siteConfig } from './src/site.config.ts'
import { addCopyButton, addTitle, addLanguage, updateStyle } from './src/utils/shikiTransformers.ts'

// https://astro.build/config
export default defineConfig({
  // Top-Level Options
  site: siteConfig.site,
  // base: '/docs',
  trailingSlash: 'never',
  output: 'server',

  // Adapter
  // 1. Vercel (serverless)
  adapter: vercelServerless(),
  // 2. Vercel (static)
  // adapter: vercelStatic(),
  // 3. Local (standalone)
  // adapter: node({ mode: 'standalone' }),
  // ---

  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp'
    },
  },

  integrations: [
    tailwind({ applyBaseStyles: false }),
    sitemap(),
    mdx(),
    icon(),
    (await import('@playform/compress')).default({
      SVG: false,
      Exclude: ['index.*.js']
    })
  ],
  // root: './my-project-directory',

  // Prefetch Options
  prefetch: true,
  // Server Options
  server: {
    host: true
  },
  // Markdown Options
  markdown: {
    // @ts-ignore
    remarkPlugins: [
      remarkMath,
      remarkReadingTime,
      remarkAlert,
      remarkGithubCards,
      remarkArxivCards
    ],
    rehypePlugins: [
      [rehypeKatex, {}],
      [
        rehypeExternalLinks,
        {
          ...(siteConfig.externalLinkArrow && { content: { type: 'text', value: ' ↗' } }),
          target: '_blank',
          rel: ['nofollow, noopener, noreferrer']
        }
      ]
    ],
    // remarkRehype: { },
    // https://docs.astro.build/en/guides/syntax-highlighting/
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark'
      },
      transformers: [updateStyle(), addTitle(), addLanguage(), addCopyButton(2000)]
    }
  }
})