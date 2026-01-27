-- ユーザーごとにSansanのオンライン名刺URLを保存するカラムを追加
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS sansan_url TEXT;

-- ユーザー自身のプロフィール更新を許可するポリシー（念のため）
-- 既に似たポリシーがあるかもしれませんが、更新操作を確実に許可します
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
