'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { auth } from '@clerk/nextjs/server'

// Gemini API Key: Using the provided key as default
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCq-WG2oUTCS3_odCj3oQTPJZkXObfEyV8';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function generateEmailTemplate(
  eventName: string,
  segment: string,
  attributes: string[],
  roles: string[]
) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('認証が必要です')

    // Use gemini-1.5-flash as default
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

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

export async function translateText(text: string, targetLang: 'en' | 'ja') {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('認証が必要です')

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Translate the following text to ${targetLang === 'en' ? 'English' : 'Japanese'}. Only output the translated text, no explanations. Text: "${text}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return { success: true, data: response.text().trim() };
  } catch (error: any) {
    console.error('Translation Error:', error);
    return { success: false, error: error.message }
  }
}
