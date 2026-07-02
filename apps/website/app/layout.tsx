import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'StubRamp — Control spend before it happens',
  description:
    'Corporate cards, bill pay, and accounting automation on one platform — built to help finance teams close the books 3× faster.',
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
