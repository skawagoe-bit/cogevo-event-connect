'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { auth } from '@clerk/nextjs/server'

// Gemini API Key should be in environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function generateEmailTemplate(
  eventName: string,
  segment: string,
  attributes: string[],
  roles: string[]
) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('認証が必要です')

    if (!process.env.GEMINI_API_KEY) {
      return { success: false, error: 'APIキーが設定されていません (GEMINI_API_KEY)' }
    }

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

    // Extract JSON from response (handling potential markdown code blocks)
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
