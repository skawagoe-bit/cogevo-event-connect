import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { ensureSupabaseUser } from '@/lib/supabase/auth-helpers'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  await ensureSupabaseUser()

  return (
    <div className="flex flex-col h-full">
      {children}
    </div>
  )
}
