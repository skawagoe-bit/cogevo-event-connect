'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

// バリデーションスキーマ
const createVisitorSchema = z.object({
  event_id: z.string().uuid(),
  name: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal('')),
  attribute: z.string().min(1, '属性は必須です'),
  segment: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  audio_url: z.string().nullable().optional(),
  memo: z.string().nullable().optional(),
})

export async function createVisitor(formData: FormData) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('認証が必要です')

    // 管理者権限でクライアントを作成（RLSをバイパスして確実に書き込む）
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // データの抽出とバリデーション
    const rawData = {
      event_id: formData.get('event_id'),
      name: formData.get('name'),
      company: formData.get('company'),
      email: formData.get('email'),
      attribute: formData.get('attribute'),
      segment: formData.get('segment'),
      image_url: formData.get('image_url'),
      audio_url: formData.get('audio_url'),
      memo: formData.get('memo'),
    }

    console.log("Received raw data in Server Action:", rawData);

    const validated = createVisitorSchema.parse(rawData)

    const { data, error } = await supabase
      .from('visitors')
      .insert({
        event_id: validated.event_id,
        name: validated.name || null,
        company: validated.company || null,
        email: validated.email || null,
        attribute: validated.attribute,
        segment: validated.segment || null,
        image_url: validated.image_url || null,
        audio_url: validated.audio_url || null,
        memo: validated.memo || null,
        is_sent: false,
        sync_status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      throw new Error(error.message || 'Database error')
    }

    revalidatePath('/list')
    return { success: true, data }
  } catch (error: any) {
    console.error('Create visitor error:', error)
    return { 
      success: false, 
      error: error.message || '訪問者の登録に失敗しました' 
    }
  }
}

export async function getVisitors(eventId: string) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('認証が必要です')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('visitors')
      .select('*')
      .eq('event_id', eventId)
      .order('scanned_at', { ascending: false })

    if (error) throw error

    return { success: true, data }
  } catch (error: any) {
    console.error('Get visitors error:', error)
    return { 
      success: false, 
      error: error.message || '訪問者リストの取得に失敗しました' 
    }
  }
}
