'use server';

import { auth, currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

export async function agreeToTerms() {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')

  const clerkUser = await currentUser()
  if (!clerkUser) throw new Error('User info not found')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Upsert user to ensure record exists, then update terms
  const { error } = await supabase
    .from('users')
    .upsert({ 
        clerk_user_id: userId,
        email: clerkUser.emailAddresses[0].emailAddress,
        full_name: `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim() || null,
        terms_agreed_at: new Date().toISOString()
    }, { onConflict: 'clerk_user_id' })

  if (error) {
    console.error("Failed to agree to terms:", error);
    throw error;
  }

  redirect('/')
}

export async function checkAccess() {
    const { userId } = await auth()
    if (!userId) return { allowed: false, reason: 'unauthenticated' }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Get User Email from Clerk (via Users table sync)
    const { data: user } = await supabase
        .from('users')
        .select('email, terms_agreed_at')
        .eq('clerk_user_id', userId)
        .single()
    
    if (!user) return { allowed: false, reason: 'no_user_record' }

    // 2. Check Whitelist
    const { data: allowed } = await supabase
        .from('allowed_users')
        .select('email')
        .eq('email', user.email)
        .single()
    
    if (!allowed) return { allowed: false, reason: 'not_whitelisted' }

    // 3. Check Terms
    if (!user.terms_agreed_at) return { allowed: false, reason: 'terms_not_agreed' }

    return { allowed: true }
}
