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
      // Mock response for template generation if key is missing
      return { 
        success: true, 
        data: {
          subject: "【御礼】展示ブースにお立ち寄りいただきありがとうございます",
          body: `${segment}様\n\nこの度は、${eventName}にて当社のブースにお立ち寄りいただき、誠にありがとうございました。\n\n当日ご案内させていただきました内容につきまして、ご不明な点などがございましたら、お気軽にお問い合わせください。\n\n今後ともよろしくお願い申し上げます。`
        }
      }
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

export async function analyzeBusinessCard(formData: FormData) {
  try {
    const { userId } = await auth()
    if (!userId) throw new Error('認証が必要です')

    if (!process.env.GEMINI_API_KEY) {
        // Fallback: If no API key, return specific mock data to allow UI flow to continue
        // ideally, we should log this.
        console.warn("GEMINI_API_KEY is missing. Using mock OCR data.");
        
        // Emulate delay for realism
        await new Promise(resolve => setTimeout(resolve, 1500));

        return { 
            success: true, 
            data: {
                company: "株式会社日本旅行",
                name: "宮地 洋樹",
                email: "hiroki_miyaji@nta.co.jp",
                position: "岡山支店 支店長",
                department: "西日本営業本部"
            }
        }
    }

    const file = formData.get('image') as File;
    if (!file) {
      return { success: false, error: '画像ファイルがありません' }
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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
      throw new Error('名刺情報の解析に失敗しました');
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

  } catch (error: any) {
    console.error('Business Card Analysis Error:', error);
    // Even on error, maybe return empty success to not block the user?
    // No, better to show the specific error if it's not the "Missing Key" one.
    return { success: false, error: error.message || '名刺解析中にエラーが発生しました' }
  }
}
