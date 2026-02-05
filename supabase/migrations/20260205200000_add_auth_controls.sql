
-- ユーザーごとの利用規約同意日時を記録するカラムを追加
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS terms_agreed_at TIMESTAMPTZ;

-- 利用許可リスト（ホワイトリスト）テーブル
CREATE TABLE IF NOT EXISTS public.allowed_users (
    email TEXT PRIMARY KEY,
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    role TEXT DEFAULT 'user' -- 'admin' or 'user'
);

-- RLS: allowed_users can be read by anyone authenticated (to check their own status)
-- But effectively, we might just use service role for checks in server actions.
ALTER TABLE public.allowed_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for authenticated users" ON public.allowed_users
    FOR SELECT TO authenticated USING (true);

-- 既存のユーザーをホワイトリストに追加（初期化用、必要に応じて調整）
INSERT INTO public.allowed_users (email, role)
SELECT email, 'admin' FROM public.users
ON CONFLICT (email) DO NOTHING;
