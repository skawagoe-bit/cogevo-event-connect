# LINE連携 設定手順

このアプリケーションでLINEログインを使用するには、以下の設定が必要です。

## 1. LINE Developersコンソールでの設定

1. **[LINE Developers](https://developers.line.biz/ja/)** にアクセスし、ログインします。
2. 新規プロバイダーを作成します（例: `CogEvo Event Connect`）。
3. 「LINEログイン」チャネルを新規作成します。
   - **チャネルの種類**: LINEログイン
   - **プロバイダー**: 作成したプロバイダーを選択
   - **アプリ名**: ユーザーに表示されるアプリ名
   - **アプリ説明**: 任意
4. 作成後、「チャネル基本設定」タブで以下をメモします。
   - **チャネルID**
   - **チャネルシークレット**

## 2. コールバックURLの設定

1. Clerkのダッシュボードで設定を行う必要があります（後述）。
2. Clerkから提供される「Authorized redirect URI」を、LINE Developersコンソールの「LINEログイン設定」タブにある「コールバックURL」に追加します。

## 3. Clerkダッシュボードでの設定

1. **[Clerk Dashboard](https://dashboard.clerk.com/)** にアクセスします。
2. 左メニューの **User & Authentication > Social Connections** を開きます。
3. **Add connection** をクリックし、「LINE」を選択します。
4. 先ほど取得した情報を入力します。
   - **Client ID**: LINEのチャネルID
   - **Client Secret**: LINEのチャネルシークレット
5. 表示されている **Authorized redirect URI** をコピーし、LINE Developersコンソールの「コールバックURL」に貼り付けます。
6. 設定を保存し、ToggleスイッチをONにして有効化します。

## 4. 環境変数の確認

Clerk側で設定が完了していれば、アプリケーションのコード変更は不要です。Clerkのログイン画面に自動的にLINEボタンが表示されるようになります。

---
**補足**: 開発環境（localhost）と本番環境（Vercel）でコールバックURLが異なる場合があります。Clerkの設定画面に従ってください。
