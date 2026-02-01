
-- バッジ撮影フローのためのカラム追加
ALTER TABLE public.visitors
ADD COLUMN IF NOT EXISTS badge_image_url TEXT, -- バッジの写真URL
ADD COLUMN IF NOT EXISTS voice_memo_url TEXT,  -- 音声録音ファイルのURL
ADD COLUMN IF NOT EXISTS process_status TEXT DEFAULT 'completed'; -- 'pending_entry' (後で入力) or 'completed' (完了)

-- process_status のコメント: 
-- 'completed': 通常の名刺スキャンや手入力で完了したもの
-- 'pending_entry': バッジ撮影モードで登録され、後でPC等で詳細入力が必要なもの
