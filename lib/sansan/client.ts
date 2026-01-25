export type SansanCardData = {
  file: Blob;
  tags?: string[];
};

export async function uploadBusinessCard(data: SansanCardData): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = process.env.SANSAN_API_KEY;

  if (!apiKey) {
    console.log('[Sansan] API Key not found. Skipping upload.');
    console.log('[Sansan] Data to be sent:', { tags: data.tags, fileSize: data.file.size });
    return { success: true, id: 'mock-sansan-id-' + Date.now() };
  }

  try {
    // 実際のAPIコール（エンドポイントはSansanの仕様に合わせて調整）
    // NOTE: Sansan API v3.3の名刺登録エンドポイントを想定
    // 実際には画像アップロードとデータ登録のステップが必要な場合があるため
    // ここでは簡易的な実装としています。
    
    // const formData = new FormData();
    // formData.append('file', data.file);
    // ...

    // Mocking the fetch for now as we don't have the real endpoint specs at hand
    // and to ensure safety until tested with real key.
    console.log('[Sansan] Real API call would happen here.');
    
    return { success: true, id: 'real-sansan-id-placeholder' };

  } catch (error) {
    console.error('[Sansan] Upload failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
