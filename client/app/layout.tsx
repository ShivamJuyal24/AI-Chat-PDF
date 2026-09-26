import type { Metadata } from 'next'
import { Geist, Geist_Mono, Source_Serif_4 } from 'next/font/google'
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

const sourceSerif = Source_Serif_4({
  variable: '--font-serif',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
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
          colorBackground: '#FBFAF5',
          colorText: '#1C1B18',
          colorTextSecondary: '#6B6960',
          colorPrimary: '#6E2A3D',
          colorTextOnPrimaryBackground: '#FBFAF5',
          colorInputBackground: '#F2EFE6',
          colorInputText: '#1C1B18',
          colorNeutral: '#1C1B18',
        },
      }}
    >
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif.variable} bg-(--paper) text-(--ink) antialiased`}
        >
          <Navbar />
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}