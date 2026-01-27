"use server"

import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const profileSchema = z.object({
  sansan_url: z.string().url('正しいURL形式で入力してください').optional().or(z.literal('')),
})

export async function updateProfile(formData: FormData) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('認証が必要です')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const rawData = {
      sansan_url: formData.get('sansan_url'),
    }

    const validated = profileSchema.parse(rawData)

    const { error } = await supabase
      .from('users')
      .update({
        sansan_url: validated.sansan_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_user_id', userId)

    if (error) throw error

    revalidatePath('/profile')
    return { success: true }
  } catch (error: any) {
    console.error('Update profile error:', error)
    return { success: false, error: error.message || 'プロフィールの更新に失敗しました' }
  }
}

export async function getProfile() {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('認証が必要です')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('users')
      .select('sansan_url')
      .eq('clerk_user_id', userId)
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error('Get profile error:', error)
    return { success: false, error: error.message }
  }
}
