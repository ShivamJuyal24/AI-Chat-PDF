'use client'

import Link from 'next/link'
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { Feather } from 'lucide-react'

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-900"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-50">
              <Feather className="h-4 w-4 text-zinc-900" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-zinc-50">Quill</span>
          </Link>

          <div className="flex items-center gap-3">
            <SignedOut>
              <SignInButton mode="modal" forceRedirectUrl="/chat">
                <button className="h-9 rounded-lg px-4 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-900">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal" forceRedirectUrl="/chat">
                <button className="h-9 rounded-lg bg-zinc-50 px-4 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200">
                  Get started
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/chat"
                className="h-9 rounded-lg px-4 text-sm font-medium leading-9 text-zinc-300 transition-colors hover:bg-zinc-900"
              >
                Workspace
              </Link>
              <UserButton
                afterSignOutUrl="/"
                appearance={{ elements: { avatarBox: 'w-9 h-9' } }}
              />
            </SignedIn>
          </div>
        </div>
      </div>
    </nav>
  )
}