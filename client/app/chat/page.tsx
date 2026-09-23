import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import SplitPage from '@/components/SplitPage'

export default async function ChatPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  return <SplitPage />
}