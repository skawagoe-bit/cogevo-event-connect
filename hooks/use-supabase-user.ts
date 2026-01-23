'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type User = Database['public']['Tables']['users']['Row']

export function useSupabaseUser() {
  const { user: clerkUser, isLoaded } = useUser()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!isLoaded) return

    if (!clerkUser) {
      setUser(null)
      setLoading(false)
      return
    }

    const fetchUser = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('clerk_user_id', clerkUser.id)
          .single()

        if (error) throw error
        setUser(data)
      } catch (err) {
        console.error('Error fetching Supabase user:', err)
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [clerkUser, isLoaded])

  return { user, loading, error, refetch: () => setLoading(true) }
}
