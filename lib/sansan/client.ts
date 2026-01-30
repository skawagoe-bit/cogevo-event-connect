export type SansanCardData = {
  file: Blob;
  tags?: string[];
};

export async function uploadBusinessCard(data: SansanCardData): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = process.env.SANSAN_API_KEY;

  if (!apiKey) {
    console.error('[Sansan] API Key is missing. Please set SANSAN_API_KEY env var.');
    return { success: false, error: 'API Key missing' };
  }

  try {
    // Sansan Open API: 名刺登録エンドポイント
    // https://docs.ap.sansan.com/ja/api/openapi/index.html
    const endpoint = 'https://api.sansan.com/v3.3/bizCards';

    // 1. 画像ファイルの送信準備
    // Sansan APIの仕様によっては、まず画像をアップロードしてIDを取得し、そのIDでデータ登録する場合があるが、
    // 一般的な「名刺登録」APIではマルチパートで画像を送る。
    // ※ ここではシンプルに /bizCards へのPOSTを想定
    
    // 注意: 具体的なAPI仕様（v3.3のbizCardsエンドポイントのパラメータ）に合わせて調整が必要。
    // ここでは一般的な "file" パラメータとして送信する実装。
    
    const formData = new FormData();
    formData.append('file', data.file, 'business_card.jpg');
    
    if (data.tags && data.tags.length > 0) {
        // タグの指定方法はAPIによる（カンマ区切りか、配列か）
        // ここではカンマ区切り文字列として送る例
        formData.append('tags', data.tags.join(','));
    }

    // 2. APIコール
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'X-Sansan-Api-Key': apiKey,
        // FormDataを使う場合、Content-Typeヘッダーは自動設定させる（boundaryが必要なため）
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Sansan] API Error:', response.status, errorText);
      return { success: false, error: `API Error: ${response.status} ${errorText}` };
    }

    const result = await response.json();
    // レスポンスの形式に合わせてIDを取得（例: result.id, result.bizCardId など）
    const cardId = result.id || result.bizCardId || 'unknown-id';

    return { success: true, id: cardId };

  } catch (error) {
    console.error('[Sansan] Upload failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
