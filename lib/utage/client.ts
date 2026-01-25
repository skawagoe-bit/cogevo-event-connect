export type UtageContactData = {
  email: string;
  name?: string;
  tags?: string[];
};

export async function addContactToUtage(data: UtageContactData): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.UTAGE_API_KEY;

  if (!apiKey) {
    console.log('[Utage] API Key not found. Skipping contact addition.');
    console.log('[Utage] Data to be sent:', { email: data.email, tags: data.tags });
    return { success: true };
  }

  try {
    // 実際のAPIコール（UTAGEの仕様に合わせて調整）
    // const response = await fetch('https://api.utage-system.com/v1/contacts', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${apiKey}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     email: data.email,
    //     name: data.name,
    //     tags: data.tags
    //   })
    // });

    console.log('[Utage] Real API call would happen here.');
    
    return { success: true };

  } catch (error) {
    console.error('[Utage] API call failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
