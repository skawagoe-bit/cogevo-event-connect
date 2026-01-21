# API仕様書

## 1. 目的
本ドキュメントは、CogEvo Event Connectにおけるフロントエンドとバックエンド（BFF/Supabase Edge Functions）間、および外部サービス（Sansan, UTAGE等）との通信仕様を定義する。

## 2. 設計原則
- **RESTful API**: 原則としてRESTの原則に従い、リソースベースのパス構成を採用する。
- **データ形式**: リクエスト・レスポンス共に JSON 形式を使用する。
- **文字コード**: UTF-8。

## 3. 認証・認可
- **認証**: ClerkによるJWT認証。
- **認可**: HTTPリクエストの `Authorization: Bearer <JWT>` ヘッダーを使用。
- **外部サービス認証**: Sansan/UTAGEのAPIキーはサーバーサイド（Vercel環境変数）で安全に管理し、フロントエンドには露出させない。

## 4. エンドポイント一覧

### 4.1 訪問者登録 API
名刺データおよび属性を保存し、外部サービスへの同期を開始する。

- **URL**: `POST /api/visitors`
- **概要**: 訪問者情報の登録、およびSansan/UTAGEへの非同期登録予約。
- **リクエスト**:
```json
{
  "event_id": "uuid",
  "name": "田中 太郎",
  "company": "XX病院",
  "email": "tanaka@example.com",
  "attribute": "OT",
  "segment": "顧客",
  "image_url": "storage/path/to/image.jpg",
  "voice_memo_url": "optional/storage/path.mp3"
}
```
- **レスポンス (201 Created)**:
```json
{
  "status": "success",
  "visitor_id": "uuid",
  "sync_status": "pending"
}
```

### 4.2 一斉送信 API
未送信の訪問者に対し、属性別のテンプレートを使用してメールを一括配信する。

- **URL**: `POST /api/events/{event_id}/send-emails`
- **概要**: 指定したイベントの「未送信」訪問者全員にメールを送信。
- **リクエスト**:
```json
{
  "event_id": "uuid"
}
```
- **レスポンス (200 OK)**:
```json
{
  "status": "success",
  "sent_count": 8,
  "failed_count": 0
}
```

### 4.3 体験URL検証 API
トークンを検証し、1週間限定体験の可否を判定する。

- **URL**: `GET /api/trial/{token}`
- **概要**: トークンの有効性と期限をチェックする。
- **レスポンス (200 OK)**:
```json
{
  "valid": true,
  "visitor_name": "田中 太郎",
  "expires_at": "2026-01-22T12:00:00Z"
}
```
- **レスポンス (403 Forbidden)**:
```json
{
  "valid": false,
  "error": "token_expired"
}
```

## 5. 外部連携詳細

### 5.1 Sansan連携
- **API**: Sansan Web API v2.0
- **送信タイミング**: `POST /api/visitors` 完了直後にバックグラウンド実行。
- **内容**: 氏名、会社名、メールアドレス、およびタグ（イベント名、属性）。

### 5.2 UTAGE連携
- **API**: UTAGE Webhook / API
- **送信タイミング**: `POST /api/visitors` 完了直後にバックグラウンド実行。
- **内容**: メールアドレス、属性、配信リストID。

### 5.3 OCR API連携
- **API**: Google Cloud Vision API または 同等サービス
- **送信タイミング**: カメラ撮影直後。
- **内容**: 画像データのBase64文字列またはStorageのパス。
