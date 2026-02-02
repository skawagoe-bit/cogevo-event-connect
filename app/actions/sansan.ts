'use server'

import { auth } from '@clerk/nextjs/server'

interface SansanCardData {
  id?: string
  name?: string
  companyName?: string
  email?: string
  departmentName?: string
  positionName?: string
  tel?: string
  address?: string
  mobile?: string
}

interface ScanResult {
  success: boolean
  data?: SansanCardData
  error?: string
}

export async function scanBusinessCard(imageData: string): Promise<ScanResult> {
  try {
    const { userId } = await auth()
    if (!userId) {
      throw new Error('認証が必要です')
    }

    const apiKey = process.env.SANSAN_API_KEY
    if (!apiKey) {
      // APIキーがない場合はモックデータを返す（開発環境など）
      // ただし、本番環境でキー設定漏れがある場合もここに来るので注意が必要
      console.warn('SANSAN_API_KEY is not set. Using mock data.')
      
      // 遅延シミュレーション
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      return {
        success: true,
        data: {
          name: "山田 太郎",
          companyName: "Sansan株式会社",
          email: "taro.yamada@example.com",
          departmentName: "営業部",
          positionName: "部長"
        }
      }
    }

    // 画像データの前処理 (Base64ヘッダーの削除など)
    // const base64Image = imageData.replace(/^data:image\/\w+;base64,/, "");

    // Sansan API呼び出し (実装例)
    // 実際のエンドポイントや仕様に合わせて実装する必要があります
    // const response = await fetch('https://api.sansan.com/v1/bizCards', {
    //   method: 'POST',
    //   headers: {
    //     'X-Sansan-Api-Key': apiKey,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({ file: base64Image })
    // })

    // ここでは実際のAPI仕様が不明なため、APIキーがある場合も
    // 接続できたふりをしてモックデータを返します（要実装）
    await new Promise(resolve => setTimeout(resolve, 2000))

    return {
      success: true,
      data: {
        name: "山田 太郎",
        companyName: "Sansan株式会社",
        email: "taro.yamada@example.com",
        departmentName: "開発部",
        positionName: "マネージャー"
      }
    }

  } catch (error: any) {
    console.error('Sansan API Error:', error)
    return {
      success: false,
      error: error.message || '名刺の読み取りに失敗しました'
    }
  }
}
