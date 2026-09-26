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
  ArrowRight,
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
      <div className="ml-10 rounded-lg bg-(--ink) p-3">
        <p className="text-sm text-(--paper)">What are the termination conditions?</p>
      </div>
      <div className="mr-10 rounded-lg border border-(--line) bg-white p-3">
        <p className="mb-1 text-xs font-medium text-(--muted)">Quill</p>
        <p className="text-sm leading-6 text-(--ink)">
          Either party can terminate with <strong className="font-semibold text-(--wine)">60 days written notice</strong>. The
          agreement also ends immediately if a material breach is not fixed within 30 days.
        </p>
      </div>
    </div>
  )
}

function UploadMock() {
  return (
    <div className="flex h-full flex-col justify-center gap-4 p-5">
      <div className="flex flex-col items-center rounded-lg border-2 border-dashed border-(--line) bg-white px-6 py-8 text-center">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-(--paper-2)">
          <Upload className="h-5 w-5 text-(--muted)" />
        </div>
        <p className="text-sm font-medium text-(--ink)">Click to upload or drag and drop</p>
        <p className="mt-1 text-xs text-(--muted)">PDF, DOC, TXT up to 50MB</p>
      </div>
      <div className="flex items-center gap-3 rounded-lg border border-(--line) bg-white p-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-(--paper-2)">
          <FileText className="h-4 w-4 text-(--ink)" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-(--ink)">Service-agreement-2026.pdf</p>
          <p className="text-xs text-(--muted)">2.4 MB &middot; Ready</p>
        </div>
        <Check className="h-4 w-4 text-(--wine)" />
      </div>
    </div>
  )
}

function AnswerMock() {
  return (
    <div className="flex h-full flex-col justify-center p-5">
      <div className="rounded-lg border border-(--line) bg-white p-4">
        <p className="mb-2 text-xs font-medium text-(--muted)">Quill</p>
        <p className="text-sm text-(--ink)">The report highlights three main risks:</p>
        <ul className="mt-2 space-y-2 text-sm text-(--ink)">
          <li className="flex gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-(--wine)" />
            <span><strong className="font-semibold">Supplier concentration</strong> &mdash; two vendors supply most components.</span>
          </li>
          <li className="flex gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-(--wine)" />
            <span><strong className="font-semibold">Currency exposure</strong> &mdash; costs are billed in a different currency.</span>
          </li>
          <li className="flex gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-(--wine)" />
            <span><strong className="font-semibold">Delivery delays</strong> &mdash; lead times grew last quarter.</span>
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
    <main className="bg-(--paper) text-(--ink)">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, var(--wine) 0%, transparent 70%)' }}
        />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-12 lg:items-center lg:pt-24">
          <div className="quill-rise quill-rise-1 lg:col-span-6">
            <span className="inline-flex items-center rounded-full border border-(--line) bg-(--paper-2) px-3 py-1 text-sm text-(--muted)">
              Chat with your documents
            </span>
            <h1 className="font-display mt-6 text-4xl leading-[1.1] tracking-tight text-(--ink) sm:text-5xl lg:text-[3.4rem]">
              Get answers from your files, not more scrolling
            </h1>
            <p className="mt-6 max-w-md text-lg leading-7 text-(--muted)">
              Upload a document and ask it questions. Quill finds the answer inside your file and explains it in plain language.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <SignUpButton mode="modal" forceRedirectUrl="/chat">
                <button className="group flex h-11 items-center gap-2 rounded-md bg-(--wine) px-6 text-sm font-medium text-(--paper) transition-colors hover:bg-(--wine-dark)">
                  Get started free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </SignUpButton>
              <SignInButton mode="modal" forceRedirectUrl="/chat">
                <button className="h-11 rounded-md border border-(--line) bg-transparent px-6 text-sm font-medium text-(--ink) transition-colors hover:border-(--ink)">
                  Sign in
                </button>
              </SignInButton>
            </div>
          </div>

          {/* Product card */}
          <div className="quill-rise quill-rise-2 lg:col-span-6">
            <div className="rounded-2xl border border-(--line) bg-(--paper-2) p-2 shadow-[0_20px_50px_-25px_rgba(28,27,24,0.35)] sm:p-3">
              <div className="grid overflow-hidden rounded-xl border border-(--line) bg-(--paper) text-left md:grid-cols-2">
                <div className="border-b border-(--line) md:border-b-0 md:border-r">
                  <UploadMock />
                </div>
                <div className="flex flex-col">
                  <ChatMock />
                  <div className="mt-auto flex gap-2 border-t border-(--line) p-4">
                    <div className="flex h-10 flex-1 items-center rounded-md border border-(--line) bg-white px-3 text-sm text-(--muted)">
                      Type your message...
                    </div>
                    <div className="flex h-10 items-center gap-2 rounded-md bg-(--ink) px-4 text-sm font-medium text-(--paper)">
                      <Send className="h-4 w-4" /> Send
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* File types (scrolls right to left) */}
      <section className="border-y border-(--line) bg-(--paper-2) py-9">
        <p className="mb-7 text-center text-sm text-(--muted)">
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
                  <li key={label} className="flex items-center gap-2 whitespace-nowrap text-sm font-medium text-(--ink)">
                    <Icon className="h-5 w-5 text-(--wine)" />
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
        <div className="max-w-xl">
          <h2 className="font-display text-3xl tracking-tight text-(--ink) sm:text-4xl">How it works</h2>
          <p className="mt-4 text-lg text-(--muted)">
            Three steps from a long document to the answer you need.
          </p>
        </div>
        <div className="mt-12 grid gap-8 lg:grid-cols-5">
          <div className="flex flex-col gap-1 lg:col-span-2" role="tablist" aria-orientation="vertical">
            {featureTabs.map(({ id, icon: Icon, title, body }) => {
              const active = tab === id
              return (
                <button
                  key={id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(id)}
                  className={`relative rounded-lg p-5 text-left transition-colors ${
                    active ? 'bg-(--paper-2)' : 'hover:bg-(--paper-2)/60'
                  }`}
                >
                  {active && <span className="absolute inset-y-3 left-0 w-0.5 rounded-full bg-(--wine)" />}
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${active ? 'text-(--wine)' : 'text-(--muted)'}`} />
                    <span className={`font-medium ${active ? 'text-(--ink)' : 'text-(--muted)'}`}>{title}</span>
                  </div>
                  {active && <p className="mt-2 pl-8 text-sm leading-6 text-(--muted)">{body}</p>}
                </button>
              )
            })}
          </div>
          <div className="min-h-[320px] rounded-2xl border border-(--line) bg-(--paper-2) p-2 lg:col-span-3">
            <div className="h-full overflow-hidden rounded-xl border border-(--line) bg-(--paper)" role="tabpanel">
              {mocks[tab]}
            </div>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section id="use-cases" className="border-y border-(--line) bg-(--paper-2)">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl tracking-tight text-(--ink) sm:text-4xl">
              Made for people who read long documents
            </h2>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-(--line) bg-(--line) md:grid-cols-3">
            {useCases.map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-(--paper) p-8">
                <Icon className="h-6 w-6 text-(--wine)" strokeWidth={1.75} />
                <h3 className="font-display mt-5 text-xl text-(--ink)">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-(--muted)">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-(--ink)">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-20 sm:px-6 md:flex-row md:items-center md:justify-between">
          <h2 className="font-display max-w-md text-3xl leading-tight text-(--paper) sm:text-4xl">
            Stop searching. Start asking.
          </h2>
          <SignUpButton mode="modal" forceRedirectUrl="/chat">
            <button className="flex h-11 shrink-0 items-center gap-2 rounded-md bg-(--paper) px-6 text-sm font-medium text-(--ink) transition-colors hover:bg-(--paper-2)">
              Get started free
              <ArrowRight className="h-4 w-4" />
            </button>
          </SignUpButton>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-(--paper)">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-(--muted) sm:flex-row sm:px-6">
          <p>&copy; {new Date().getFullYear()} Quill. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#features" className="transition-colors hover:text-(--ink)">Features</a>
            <Link href="/sign-in" className="transition-colors hover:text-(--ink)">Sign in</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}