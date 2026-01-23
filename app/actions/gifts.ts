'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

// ギフトアイテムのバリデーションスキーマ
const giftItemSchema = z.object({
  name: z.string().min(1, 'ギフト名は必須です'),
  stock_count: z.coerce.number().min(0, '在庫数は0以上である必要があります'),
  image_url: z.string().optional().or(z.literal('')),
  event_id: z.string().uuid(),
})

export async function createGift(formData: FormData) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('認証が必要です')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const rawData = {
      name: formData.get('name'),
      stock_count: formData.get('stock_count'),
      image_url: formData.get('image_url'),
      event_id: formData.get('event_id'),
    }

    const validated = giftItemSchema.parse(rawData)

    const { data, error } = await supabase
      .from('gift_items')
      .insert({
        name: validated.name,
        stock_count: validated.stock_count,
        image_url: validated.image_url || null,
        event_id: validated.event_id,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/gift')
    return { success: true, data }
  } catch (error) {
    console.error('Create gift error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'ギフトの登録に失敗しました',
    }
  }
}

export async function updateGiftStock(id: string, newStock: number) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('認証が必要です')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('gift_items')
      .update({ stock_count: newStock, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/gift')
    return { success: true, data }
  } catch (error) {
    console.error('Update gift stock error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '在庫の更新に失敗しました',
    }
  }
}
