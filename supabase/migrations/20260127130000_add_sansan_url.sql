-- ユーザーのSansan URLを保存するカラムを追加
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS sansan_url TEXT;

-- ユーザーは自分の情報のみ更新できるようにRLSポリシーを確認（既存ポリシーでカバーされているはずだが念のため）
-- usersテーブルのRLSが有効であることを前提としています
