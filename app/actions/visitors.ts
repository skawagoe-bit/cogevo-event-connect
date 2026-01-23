'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { ensureSupabaseUser } from '@/lib/supabase/auth-helpers'

// バリデーションスキーマ
const createVisitorSchema = z.object({
  event_id: z.string().uuid(),
  name: z.string().optional(),
  company: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  attribute: z.string().min(1, '属性は必須です'),
  segment: z.string().optional(),
  image_url: z.string().optional(),
})

export async function createVisitor(formData: FormData) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('認証が必要です')

    await ensureSupabaseUser()
    const supabase = await createClient()

    // データの抽出とバリデーション
    const rawData = {
      event_id: formData.get('event_id'),
      name: formData.get('name'),
      company: formData.get('company'),
      email: formData.get('email'),
      attribute: formData.get('attribute'),
      segment: formData.get('segment'),
      image_url: formData.get('image_url'),
    }

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
        is_sent: false,
        sync_status: 'pending'
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/list')
    return { success: true, data }
  } catch (error) {
    console.error('Create visitor error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '訪問者の登録に失敗しました' 
    }
  }
}
