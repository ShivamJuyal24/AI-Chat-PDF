'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SignInButton, SignUpButton } from '@clerk/nextjs'
import {
  Check,
  FileText,
  FileSpreadsheet,
  FileType,
  MessageSquare,
  Send,
  Upload,
  Scale,
  FlaskConical,
  Briefcase,
} from 'lucide-react'

const fileTypes = [
  { icon: FileText, label: 'PDF files' },
  { icon: FileType, label: 'Word documents' },
  { icon: FileText, label: 'Plain text' },
  { icon: FileSpreadsheet, label: 'Spreadsheets' },
  { icon: Scale, label: 'Contracts' },
  { icon: FlaskConical, label: 'Research papers' },
  { icon: Briefcase, label: 'Reports' },
  { icon: MessageSquare, label: 'Meeting notes' },
]

const featureTabs = [
  {
    id: 'upload',
    icon: Upload,
    title: 'Upload in one step',
    body: 'Drag a file into the workspace. It is ready to query as soon as the upload finishes.',
  },
  {
    id: 'ask',
    icon: MessageSquare,
    title: 'Ask in plain language',
    body: 'Type a question the way you would ask a colleague. No search syntax, no keywords to guess.',
  },
  {
    id: 'read',
    icon: FileText,
    title: 'Read answers that are easy to scan',
    body: 'Responses come back with lists, bold key terms, and short paragraphs instead of a wall of text.',
  },
]

const useCases = [
  {
    icon: Scale,
    title: 'Contracts and policies',
    body: 'Check notice periods, payment terms, and obligations without reading every clause.',
  },
  {
    icon: FlaskConical,
    title: 'Papers and reports',
    body: 'Pull out the method, the results, or the limitations from a long study in seconds.',
  },
  {
    icon: Briefcase,
    title: 'Meeting notes and briefs',
    body: 'Ask what was decided, who owns the next step, and what is still open.',
  },
]

function ChatMock() {
  return (
    <div className="flex h-full flex-col gap-3 p-5">
      <div className="ml-10 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
        <p className="text-sm text-zinc-50">What are the termination conditions?</p>
      </div>
      <div className="mr-10 rounded-xl border border-zinc-800 bg-zinc-950 p-3">
        <p className="mb-1 text-xs font-medium text-zinc-500">Assistant</p>
        <p className="text-sm leading-6 text-zinc-300">
          Either party can terminate with <strong className="text-zinc-50">60 days written notice</strong>. The
          agreement also ends immediately if a material breach is not fixed within 30 days.
        </p>
      </div>
    </div>
  )
}

function UploadMock() {
  return (
    <div className="flex h-full flex-col justify-center gap-4 p-5">
      <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-950 px-6 py-8 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900">
          <Upload className="h-6 w-6 text-zinc-500" />
        </div>
        <p className="text-sm font-medium text-zinc-50">Click to upload or drag and drop</p>
        <p className="mt-1 text-xs text-zinc-500">PDF, DOC, TXT up to 50MB</p>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-900">
          <FileText className="h-4 w-4 text-zinc-300" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-50">Service-agreement-2026.pdf</p>
          <p className="text-xs text-zinc-500">2.4 MB - Ready</p>
        </div>
        <Check className="h-4 w-4 text-zinc-50" />
      </div>
    </div>
  )
}

function AnswerMock() {
  return (
    <div className="flex h-full flex-col justify-center p-5">
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <p className="mb-2 text-xs font-medium text-zinc-500">Assistant</p>
        <p className="text-sm text-zinc-300">The report highlights three main risks:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-300">
          <li>
            <strong className="text-zinc-50">Supplier concentration:</strong> two vendors supply most components.
          </li>
          <li>
            <strong className="text-zinc-50">Currency exposure:</strong> costs are billed in a different currency.
          </li>
          <li>
            <strong className="text-zinc-50">Delivery delays:</strong> lead times grew in the last quarter.
          </li>
        </ul>
      </div>
    </div>
  )
}

const mocks: Record<string, React.ReactNode> = {
  upload: <UploadMock />,
  ask: <ChatMock />,
  read: <AnswerMock />,
}

export default function LandingPage() {
  const [tab, setTab] = useState('upload')

  return (
    <main className="bg-zinc-950 text-zinc-50">
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-20 text-center sm:px-6 lg:pt-28">
        <span className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-sm text-zinc-400">
          Chat with your documents
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-zinc-50 sm:text-6xl">
          Get answers from your files, not more scrolling
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
          Upload a document and ask it questions. Quill finds the answer inside your file and explains it in plain language.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <SignUpButton mode="modal" forceRedirectUrl="/chat">
            <button className="h-11 rounded-lg bg-zinc-50 px-6 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200">
              Get started free
            </button>
          </SignUpButton>
          <SignInButton mode="modal" forceRedirectUrl="/chat">
            <button className="h-11 rounded-lg border border-zinc-800 bg-zinc-950 px-6 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-900">
              Sign in
            </button>
          </SignInButton>
        </div>

        {/* Product card */}
        <div className="mt-16 rounded-2xl border border-zinc-800 bg-zinc-900 p-2 sm:p-3">
          <div className="grid overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 text-left md:grid-cols-2">
            <div className="border-b border-zinc-800 bg-zinc-900/50 md:border-b-0 md:border-r">
              <UploadMock />
            </div>
            <div className="flex flex-col">
              <ChatMock />
              <div className="mt-auto flex gap-2 border-t border-zinc-800 p-4">
                <div className="flex h-10 flex-1 items-center rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-600">
                  Type your message...
                </div>
                <div className="flex h-10 items-center gap-2 rounded-lg bg-zinc-50 px-4 text-sm font-medium text-zinc-900">
                  <Send className="h-4 w-4" /> Send
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* File types (scrolls right to left) */}
      <section className="border-y border-zinc-800 bg-zinc-900/50 py-10">
        <style>{`
          @keyframes quill-marquee {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
          .quill-marquee { animation: quill-marquee 35s linear infinite; }
          .quill-marquee:hover { animation-play-state: paused; }
          @media (prefers-reduced-motion: reduce) {
            .quill-marquee { animation: none; }
          }
        `}</style>
        <p className="mb-8 text-center text-sm text-zinc-400">
          Works with the files you already have
        </p>
        <div
          className="overflow-hidden"
          style={{
            maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
          }}
        >
          <div className="quill-marquee flex w-max">
            {[0, 1].map((copy) => (
              <ul key={copy} className="flex shrink-0 items-center gap-12 pr-12" aria-hidden={copy === 1}>
                {fileTypes.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-2 whitespace-nowrap text-sm font-medium text-zinc-300">
                    <Icon className="h-5 w-5 text-zinc-500" />
                    {label}
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </section>

      {/* Vertical tab features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">How it works</h2>
          <p className="mt-4 text-lg text-zinc-400">
            Three steps from a long document to the answer you need.
          </p>
        </div>
        <div className="mt-12 grid gap-8 lg:grid-cols-5">
          <div className="flex flex-col gap-2 lg:col-span-2" role="tablist" aria-orientation="vertical">
            {featureTabs.map(({ id, icon: Icon, title, body }) => {
              const active = tab === id
              return (
                <button
                  key={id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(id)}
                  className={`rounded-xl border p-5 text-left transition-colors ${
                    active ? 'border-zinc-800 bg-zinc-900' : 'border-transparent hover:bg-zinc-900/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${active ? 'text-zinc-50' : 'text-zinc-500'}`} />
                    <span className={`font-semibold ${active ? 'text-zinc-50' : 'text-zinc-300'}`}>{title}</span>
                  </div>
                  {active && <p className="mt-2 pl-8 text-sm leading-6 text-zinc-400">{body}</p>}
                </button>
              )
            })}
          </div>
          <div className="min-h-[320px] rounded-2xl border border-zinc-800 bg-zinc-900 p-2 lg:col-span-3">
            <div className="h-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50" role="tabpanel">
              {mocks[tab]}
            </div>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="border-y border-zinc-800 bg-zinc-900/50">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Made for people who read long documents
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {useCases.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900">
                  <Icon className="h-5 w-5 text-zinc-300" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-zinc-900/50">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-zinc-500 sm:flex-row sm:px-6">
          <p>&copy; {new Date().getFullYear()} Quill. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="#features" className="hover:text-zinc-50">Features</Link>
            <Link href="/sign-in" className="hover:text-zinc-50">Sign in</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}