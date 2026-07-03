import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'StubRamp — Control spend before it happens',
  description:
    'Corporate cards, bill pay, and accounting automation on one platform — built to help finance teams close the books 3× faster.',
  // Technical test only — keep out of all search engines and AI crawlers.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
  other: {
    // Emerging AI-crawler opt-out signals (not honoured by every bot,
    // but harmless and reinforces intent alongside robots.txt).
    'ai-content-declaration': 'noai, noimageai',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
