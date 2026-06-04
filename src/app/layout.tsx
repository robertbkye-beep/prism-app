import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PRISM Performance System | Avatar Training',
  description: 'Human Performance Architecture — Avatar Training by Robert Boakye',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
