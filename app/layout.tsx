import React from 'react'
import type { Metadata } from 'next'
import { Press_Start_2P } from 'next/font/google'
import './globals.css'

const pixelFont = Press_Start_2P({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  variable: '--font-pixel',
})

export const metadata: Metadata = {
  title: 'SignalCast - On-Chain Copy Trading',
  description: 'Track investment moves of Farcaster influencers with AI pets.',
  manifest: '/manifest.json',
  other: {
    'viewport': 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'SignalCast',
    'mobile-web-app-capable': 'yes',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${pixelFont.variable} font-sans`}>
      <body className="bg-gradient-to-br from-purple-50 to-blue-50 min-h-screen">
        {children}
      </body>
    </html>
  )
} 