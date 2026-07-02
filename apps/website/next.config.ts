import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // @stubramp/ui ships raw .tsx source (see its package exports), so Next
  // must transpile it rather than treat it as pre-built JS.
  transpilePackages: ['@stubramp/ui'],
  // Pin the workspace root — an unrelated lockfile above the repo would
  // otherwise make Next infer the wrong root and mis-resolve the workspace.
  turbopack: {
    root: path.join(import.meta.dirname, '..', '..'),
  },
}

export default nextConfig
