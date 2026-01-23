# ✅ Supabase + Clerk 統合完了レポート

実装日: 2026-01-22

## 📦 インストールされたパッケージ

- @clerk/nextjs: latest
- @supabase/supabase-js: latest
- @supabase/ssr: latest

## 🗄️ データベース構造

### 作成されたテーブル
- `users`: Clerkユーザーと同期
- `events`: イベント情報
- `visitors`: 来場者情報
- `trial_links`: 体験URL管理
- `gift_logs`: ギフト提供ログ

### マイグレーションファイル
- `supabase/migrations/20250122120000_init_schema.sql`

## 🔐 認証フロー

1. **サインアップ/サインイン**: Clerkが提供するUIを使用 (`/sign-in`, `/sign-up`)
2. **ミドルウェア**: `middleware.ts` で Supabase のセッションを管理
3. **ユーザー同期**:
   - ユーザーが保護されたページ (`/dashboard` など) にアクセスした際、`layout.tsx` 内で `ensureSupabaseUser()` が実行されます。
   - `ensureSupabaseUser()` は Clerk のユーザー情報を Supabase の `users` テーブルに同期（upsert）します。
   - これにより、Webhook を使用せずに確実な同期が可能になります。

## 🔌 API エンドポイント / Actions

- `app/actions/visitors.ts`: `createVisitor` (訪問者登録)

## 📝 次のステップ

1. [ ] `.env.local` の設定 (Clerk & Supabase API Keys)
2. [ ] Supabase Dashboard でのマイグレーション実行
3. [ ] Clerk Dashboard での Redirect URL 設定
4. [ ] 動作確認 (サインイン -> ダッシュボードアクセス -> ユーザー同期確認)

## 🐛 既知の問題・制限事項

- 特になし

## 📖 参考リソース

- [Clerk Documentation](https://clerk.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
