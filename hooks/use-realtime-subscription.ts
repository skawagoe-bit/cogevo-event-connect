import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

/**
 * Supabase Realtimeを使用するためのカスタムフック
 * @param channelName チャンネル名（例: 'room:123'）
 * @param eventName 監視するイベント名（'INSERT', 'UPDATE', 'DELETE', '*'）
 * @param table 監視するテーブル名
 * @param filter フィルタ条件（例: 'event_id=eq.123'）
 * @param callback データ変更時に実行されるコールバック関数
 */
export function useRealtimeSubscription<T extends { [key: string]: any }>(
  channelName: string,
  eventName: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
  table: string,
  filter: string | undefined,
  callback: (payload: RealtimePostgresChangesPayload<T>) => void
) {
  const [isConnected, setIsConnected] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // 既に接続済みの場合はスキップ
    if (channelRef.current?.state === 'joined') return

    // チャンネルの設定
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: true },
        presence: { key: channelName },
        private: true, // RLSを適用するためにprivateにする
      },
    })

    // イベントリスナーの登録
    channel
      .on(
        'postgres_changes' as any,
        {
          event: eventName,
          schema: 'public',
          table: table,
          filter: filter,
        },
        (payload) => {
          callback(payload as RealtimePostgresChangesPayload<T>)
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setIsConnected(false)
        }
      })

    channelRef.current = channel

    // クリーンアップ
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
        setIsConnected(false)
      }
    }
  }, [channelName, eventName, table, filter, callback])

  return { isConnected }
}
