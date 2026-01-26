
"use server"

import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'

const eventSchema = z.object({
  name: z.string().min(1, 'イベント名は必須です'),
  event_date: z.string(),
  attributes_preset: z.array(z.string()).optional(),
  segments_preset: z.array(z.string()).optional(),
  roles_preset: z.array(z.string()).optional(),
})

export async function createEvent(formData: FormData) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('認証が必要です')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ユーザーIDの取得 (Clerk ID -> Supabase User ID)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (userError || !user) throw new Error('ユーザー情報の取得に失敗しました')

    const rawData = {
      name: formData.get('name'),
      event_date: formData.get('event_date'),
      attributes_preset: formData.get('attributes_preset') 
        ? JSON.parse(formData.get('attributes_preset') as string)
        : undefined,
      segments_preset: formData.get('segments_preset')
        ? JSON.parse(formData.get('segments_preset') as string)
        : undefined,
      roles_preset: formData.get('roles_preset')
        ? JSON.parse(formData.get('roles_preset') as string)
        : undefined,
    }

    const validated = eventSchema.parse(rawData)

    const { data, error } = await supabase
      .from('events')
      .insert({
        name: validated.name,
        event_date: validated.event_date,
        user_id: user.id,
        attributes_preset: validated.attributes_preset,
        segments_preset: validated.segments_preset,
        roles_preset: validated.roles_preset,
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error('Create event error:', error)
    return { success: false, error: error.message }
  }
}

export async function getEventsByMonth(year: number, month: number) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 月初と月末の日付を計算
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0).toISOString();

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('event_date', startDate)
      .lte('event_date', endDate)
      .order('event_date', { ascending: true })

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error('Get events error:', error)
    return { success: false, error: error.message }
  }
}
