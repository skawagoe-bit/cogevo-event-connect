'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { uploadBusinessCard } from '@/lib/sansan/client'
import { addContactToUtage } from '@/lib/utage/client'

// バリデーションスキーマ
const createVisitorSchema = z.object({
  event_id: z.string().uuid(),
  name: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal('')),
  attribute: z.string().min(1, '属性は必須です'),
  segment: z.string().nullable().optional(),
  memo: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  audio_url: z.string().nullable().optional(),
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
      memo: formData.get('memo'),
      image_url: formData.get('image_url'),
      audio_url: formData.get('audio_url'),
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
        memo: validated.memo || null,
        image_url: validated.image_url || null,
        audio_url: validated.audio_url || null,
        is_sent: false,
        sync_status: 'pending'
      })
      .select()
      .single()

    if (error) throw error

    // Sansan連携 (非同期で実行)
    if (validated.image_url) {
      console.log('[Sansan Sync] Triggering upload for visitor:', data.id)
      
      // 画像データを取得
      // image_url は公開URL前提。署名付きURLの場合は別途生成が必要。
      const imageResponse = await fetch(validated.image_url);
      if (imageResponse.ok) {
          const imageBlob = await imageResponse.blob();
          
          // 非同期で実行（awaitしない）
          uploadBusinessCard({ 
            file: imageBlob, 
            tags: [validated.attribute, 'EventID:' + validated.event_id] 
          }).then(res => {
            if (res.success) {
               console.log('[Sansan Sync] Success, ID:', res.id)
            } else {
               console.error('[Sansan Sync] Failed:', res.error)
            }
          }).catch(e => console.error('[Sansan Sync] Error:', e))
      } else {
          console.error('[Sansan Sync] Failed to download image from Supabase');
      }
    }

    // UTAGE連携 (メールアドレスがある場合のみ)
    if (validated.email) {
        console.log('[Utage Sync] Triggering contact add for:', validated.email)
        addContactToUtage({
            email: validated.email,
            name: validated.name || undefined,
            tags: [validated.attribute, 'EventID:' + validated.event_id]
        }).then(res => {
            if (res.success) {
                console.log('[Utage Sync] Success')
            }
        }).catch(e => console.error('[Utage Sync] Error:', e))
    }

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

export async function deleteVisitor(id: string) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('認証が必要です')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase
      .from('visitors')
      .delete()
      .eq('id', id)

    if (error) throw error

    revalidatePath('/list')
    return { success: true }
  } catch (error) {
    console.error('Delete visitor error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '削除に失敗しました' 
    }
  }
}
