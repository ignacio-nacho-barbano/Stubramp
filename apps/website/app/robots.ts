import type { MetadataRoute } from 'next'

// Required so the robots.txt metadata route is emitted as a static file under
// `output: 'export'` (see next.config.ts).
export const dynamic = 'force-static'

// Technical test only: block every crawler, including AI/LLM training bots.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Catch-all: block every conventional crawler.
      {
        userAgent: '*',
        disallow: '/',
      },
      // Named AI / LLM training + retrieval crawlers, blocked explicitly.
      {
        userAgent: [
          'GPTBot',
          'OAI-SearchBot',
          'ChatGPT-User',
          'ClaudeBot',
          'Claude-Web',
          'anthropic-ai',
          'Google-Extended',
          'GoogleOther',
          'Applebot-Extended',
          'CCBot',
          'PerplexityBot',
          'Perplexity-User',
          'Bytespider',
          'Amazonbot',
          'meta-externalagent',
          'FacebookBot',
          'Diffbot',
          'Omgilibot',
          'cohere-ai',
          'YouBot',
        ],
        disallow: '/',
      },
    ],
  }
}
