'use server';

import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function inviteUser(email: string) {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if inviter is allowed (and maybe admin? For now just allowed)
    // Ideally we check role here.
    
    // Add to allowed_users
    const { error } = await supabase
        .from('allowed_users')
        .insert({ 
            email: email,
            invited_at: new Date().toISOString(),
            role: 'user'
        })
    
    if (error) {
        if (error.code === '23505') { // Unique violation
            return { success: false, error: 'このメールアドレスは既に登録されています' }
        }
        return { success: false, error: error.message }
    }

    revalidatePath('/admin/users')
    return { success: true }
}

export async function getAllowedUsers() {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
        .from('allowed_users')
        .select('*')
        .order('invited_at', { ascending: false })

    if (error) throw error
    return data
}

export async function removeAllowedUser(email: string) {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase
        .from('allowed_users')
        .delete()
        .eq('email', email)

    if (error) return { success: false, error: error.message }
    revalidatePath('/admin/users')
    return { success: true }
}
