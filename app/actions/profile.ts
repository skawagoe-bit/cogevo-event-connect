"use server"

import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'

const profileSchema = z.object({
  sansan_url: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
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

    // Clerk IDからSupabase User IDを取得して更新
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (userError || !user) throw new Error('ユーザー情報の取得に失敗しました')

    const { error } = await supabase
      .from('users')
      .update({
        sansan_url: validated.sansan_url || null
      })
      .eq('id', user.id)

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    console.error('Update profile error:', error)
    return { success: false, error: error.message }
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
