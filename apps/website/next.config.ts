import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Fully static site — export to plain HTML/assets for Cloudflare Pages.
  // Note: headers() below is ignored under `output: 'export'` (no server);
  // the X-Robots-Tag is served in production via public/_headers, which
  // Cloudflare Pages applies to every response.
  output: 'export',
  // @stubramp/ui ships raw .tsx source (see its package exports), so Next
  // must transpile it rather than treat it as pre-built JS.
  transpilePackages: ['@stubramp/ui'],
  // Pin the workspace root — an unrelated lockfile above the repo would
  // otherwise make Next infer the wrong root and mis-resolve the workspace.
  turbopack: {
    root: path.join(import.meta.dirname, '..', '..'),
  },
  // Technical test only — carry the noindex directive on every response,
  // including non-HTML assets that meta tags can't cover.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive, nosnippet, noimageindex, noai, noimageai',
          },
        ],
      },
    ]
  },
}

export default nextConfig
