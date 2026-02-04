'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { auth } from '@clerk/nextjs/server'

// Gemini API Key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// SDKを使わずに直接REST APIを叩くヘルパー関数
async function callGeminiDirectly(promptText: string, modelName: string = 'gemini-1.5-flash') {
  if (!GEMINI_API_KEY) throw new Error('API Key is missing');
  
  // v1beta API endpoint with explicit model name
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: promptText }]
      }]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Gemini API Error:', JSON.stringify(errorData, null, 2));
    throw new Error(`Gemini API request failed: ${response.status} ${response.statusText} - ${errorData.error?.message || ''}`);
  }

  const data = await response.json();
  if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content || !data.candidates[0].content.parts || data.candidates[0].content.parts.length === 0) {
    throw new Error('No content generated');
  }

  return data.candidates[0].content.parts[0].text;
}

export async function generateEmailTemplate(
  eventName: string,
  segment: string,
  attributes: string[],
  roles: string[]
) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('認証が必要です')

    const prompt = `
    あなたは展示会や学会のブース担当者です。
    以下の情報をもとに、来場者へ送る「お礼メール」の件名と本文を作成してください。
    
    【イベント情報】
    イベント名: ${eventName}
    主な来場者属性: ${attributes.join(', ')}
    主な役割: ${roles.join(', ')}
    
    【送信相手の区分】
    ${segment}
    
    【要件】
    - 件名は30文字以内で、開封したくなるような魅力的なものにしてください。
    - 本文は、相手の区分（${segment}）に合わせた適切なトーンと内容にしてください。
    - ${segment}が「新規リード」の場合は興味喚起を、「既存顧客」の場合は感謝と関係強化を、「パートナー」の場合は協業の可能性を意識してください。
    - JSON形式で出力してください。フォーマット: { "subject": "件名", "body": "本文" }
    - 本文中の改行は \n を使用してください。
    `;

    // Try ONLY gemini-1.5-flash as verified in AI Studio
    let text = '';
    try {
        text = await callGeminiDirectly(prompt, 'gemini-1.5-flash');
    } catch (e: any) {
        // Fallback to gemini-1.0-pro only if flash fails unexpectedly
        console.warn('gemini-1.5-flash failed, trying gemini-1.0-pro', e);
        if (e.message.includes('404')) {
             throw new Error('モデルが見つかりません。APIキーの設定を確認してください。');
        }
        text = await callGeminiDirectly(prompt, 'gemini-1.0-pro');
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AIからの応答を解析できませんでした');
    }

    const json = JSON.parse(jsonMatch[0]);

    return { 
      success: true, 
      data: {
        subject: json.subject,
        body: json.body
      }
    }

  } catch (error: any) {
    console.error('AI Generation Error:', error);
    return { success: false, error: error.message || 'AI生成中にエラーが発生しました' }
  }
}



export async function analyzeBusinessCard(formData: FormData, apiKey?: string) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('認証が必要です')

    const file = formData.get('image') as File;
    if (!file) {
      return { success: false, error: '画像ファイルがありません' }
    }

    // Use provided key or env key or default
    const keyToUse = apiKey || GEMINI_API_KEY;
    const client = new GoogleGenerativeAI(keyToUse);

    const arrayBuffer = await file.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');

    const prompt = `
    この名刺画像を解析し、以下の情報をJSON形式で抽出してください。
    
    【抽出項目】
    - company: 会社名・組織名
    - name: 氏名
    - email: メールアドレス
    - position: 役職（あれば）
    - department: 部署（あれば）
    
    【要件】
    - OCRの精度を高く保ってください。
    - JSON形式のみを出力してください。
    - 値が見つからない場合は空文字 "" にしてください。
    `;

    // Try multiple models in order of preference/speed
    const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-pro'];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
        try {
            console.log(`Trying Gemini model: ${modelName}`);
            const model = client.getGenerativeModel({ model: modelName });
            
            const result = await model.generateContent([
              prompt,
              {
                inlineData: {
                  data: base64Image,
                  mimeType: file.type || 'image/jpeg',
                },
              },
            ]);
    
            const response = await result.response;
            const text = response.text();
    
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
              throw new Error(`名刺情報の解析に失敗しました (${modelName})`);
            }
    
            const json = JSON.parse(jsonMatch[0]);
    
            return { 
              success: true, 
              data: {
                company: json.company,
                name: json.name,
                email: json.email,
                position: json.position,
                department: json.department
              }
            }
        } catch (genError: any) {
            console.warn(`Model ${modelName} failed:`, genError.message);
            lastError = genError;
            // If it's not a 404/Not Found, it might be a transient error, but we continue trying other models anyway
            // if it IS a 404, we definitely want to try the next one.
        }
    }

    // If all models fail
    if (lastError) {
        if (lastError.message && (lastError.message.includes('404') || lastError.message.includes('not found'))) {
             throw new Error(`利用可能なGeminiモデルが見つかりませんでした。APIキーの権限設定またはモデルの利用可否を確認してください。`);
        }
        throw lastError;
    }
    
    throw new Error('不明なエラーが発生しました');

  } catch (error: any) {
    console.error('Business Card Analysis Error:', error);
    return { success: false, error: error.message || '名刺解析中にエラーが発生しました' }
  }
}

export async function transcribeAudio(formData: FormData, apiKey?: string) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('認証が必要です')

    const file = formData.get('audio') as File;
    if (!file) {
      return { success: false, error: '音声ファイルがありません' }
    }

    const keyToUse = apiKey || GEMINI_API_KEY;
    const client = new GoogleGenerativeAI(keyToUse);

    const arrayBuffer = await file.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');

    const model = client.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = "以下の音声を文字起こししてください。商談のメモです。要点をまとめて箇条書きにしてください。";

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Audio,
          mimeType: file.type || 'audio/webm',
        },
      },
    ]);

    const response = await result.response;
    return { success: true, text: response.text() };

  } catch (error: any) {
    console.error('Transcription Error:', error);
    return { success: false, error: error.message || '文字起こしに失敗しました' }
  }
}

export async function translateText(text: string, targetLang: 'en' | 'ja') {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('認証が必要です')

    const prompt = `Translate the following text to ${targetLang === 'en' ? 'English' : 'Japanese'}. Only output the translated text, no explanations. Text: "${text}"`;

    // Try directly calling API with gemini-1.5-flash
    let translated = '';
    try {
        translated = await callGeminiDirectly(prompt, 'gemini-1.5-flash');
    } catch (e) {
        translated = await callGeminiDirectly(prompt, 'gemini-1.0-pro');
    }
    
    return { success: true, data: translated.trim() };
  } catch (error: any) {
    console.error('Translation Error:', error);
    return { success: false, error: error.message }
  }
}
