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
    <nav className="sticky top-0 z-50 border-b border-(--line) bg-(--paper)/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--wine)"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-(--wine)">
              <Feather className="h-4 w-4 text-(--paper)" />
            </div>
            <span className="font-display text-lg text-(--ink)">Quill</span>
          </Link>

          <div className="flex items-center gap-3">
            <SignedOut>
              <SignInButton mode="modal" forceRedirectUrl="/chat">
                <button className="h-9 rounded-md px-4 text-sm font-medium text-(--muted) transition-colors hover:bg-(--paper-2) hover:text-(--ink)">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal" forceRedirectUrl="/chat">
                <button className="h-9 rounded-md bg-(--ink) px-4 text-sm font-medium text-(--paper) transition-colors hover:bg-(--wine)">
                  Get started
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/chat"
                className="h-9 rounded-md px-4 text-sm font-medium leading-9 text-(--muted) transition-colors hover:bg-(--paper-2) hover:text-(--ink)"
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