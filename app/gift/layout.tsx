import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { ensureSupabaseUser } from '@/lib/supabase/auth-helpers'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // ClerkユーザーをSupabaseに同期
  await ensureSupabaseUser()

  return (
    <>
      {children}
    </>
  )
}
