import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import Navbar from '@/components/Navbar'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'Quill - Ask your documents anything',
    template: '%s | Quill',
  },
  description:
    'Upload a document and get answers in plain language. Quill reads your files so you can find what matters without scrolling through pages.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorBackground: '#18181b',
          colorText: '#fafafa',
          colorTextSecondary: '#a1a1aa',
          colorPrimary: '#fafafa',
          colorTextOnPrimaryBackground: '#18181b',
          colorInputBackground: '#27272a',
          colorInputText: '#fafafa',
          colorNeutral: '#fafafa',
        },
      }}
    >
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} bg-zinc-950 text-zinc-50 antialiased`}
        >
          <Navbar />
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}