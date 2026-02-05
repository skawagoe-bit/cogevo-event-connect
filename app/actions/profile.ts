"use server"

import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'

const profileSchema = z.object({
  sansan_url: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  full_name: z.string().optional().or(z.literal('')),
  department: z.string().optional().or(z.literal('')),
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
      full_name: formData.get('full_name'),
      department: formData.get('department'),
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
        sansan_url: validated.sansan_url || null,
        full_name: validated.full_name || null,
        department: validated.department || null,
      })
      .eq('id', user.id)

    if (error) throw error

    return { success: true }
  } catch (error: unknown) {
    console.error('Update profile error:', error)
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg }
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
      .select('sansan_url, full_name, department, email')
      .eq('clerk_user_id', userId)
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error: unknown) {
    console.error('Get profile error:', error)
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg }
  }
}
