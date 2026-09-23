import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-zinc-900/50 px-4">
      <SignUp forceRedirectUrl="/chat" />
    </main>
  )
}