'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

const createGiftSchema = z.object({
  name: z.string().min(1, 'ギフト名は必須です'),
  stock_count: z.coerce.number().min(0),
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
      event_id: formData.get('event_id'),
    }

    const validated = createGiftSchema.parse(rawData)

    const { error } = await supabase
      .from('gift_items')
      .insert({
        name: validated.name,
        stock_count: validated.stock_count,
        event_id: validated.event_id,
        is_active: true
      })

    if (error) throw error

    revalidatePath('/gift')
    return { success: true }
  } catch (error) {
    console.error('Create gift error:', error)
    return { success: false, error: 'ギフトの登録に失敗しました' }
  }
}

export async function updateStock(id: string, delta: number) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('認証が必要です')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 現在の在庫を取得して増減させる（アトミックな処理ではないが簡易実装）
    // 本来は RPC (stored procedure) を使うのが安全
    const { data: item, error: fetchError } = await supabase
      .from('gift_items')
      .select('stock_count')
      .eq('id', id)
      .single()
    
    if (fetchError) throw fetchError

    const newStock = (item.stock_count || 0) + delta
    if (newStock < 0) throw new Error('在庫が足りません')

    const { error } = await supabase
      .from('gift_items')
      .update({ stock_count: newStock })
      .eq('id', id)

    if (error) throw error

    revalidatePath('/gift')
    return { success: true }
  } catch (error) {
    console.error('Update stock error:', error)
    return { success: false, error: '在庫の更新に失敗しました' }
  }
}
