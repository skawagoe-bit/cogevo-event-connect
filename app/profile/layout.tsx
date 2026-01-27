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

  // Ensure user exists in Supabase
  await ensureSupabaseUser()

  return (
    <>
      {children}
    </>
  )
}
