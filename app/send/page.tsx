"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockVisitors } from "@/lib/mock-data";

export default function SendPage() {
  const router = useRouter();
  const [isSent, setIsSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // In a real app, calculate from actual state
  const unsentCount = mockVisitors.filter(v => !v.isSent).length;

  const handleSend = () => {
    setIsSending(true);
    // Mock API call
    setTimeout(() => {
      setIsSending(false);
      setIsSent(true);
    }, 2000);
  };

  if (isSent) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-blue-50/50 p-6 space-y-8 animate-in fade-in duration-500">
        <div className="bg-white p-6 rounded-full shadow-xl animate-bounce">
           <CheckCircle2 className="w-20 h-20 text-primary" />
        </div>
        <div className="text-center space-y-4">
           <h2 className="text-3xl font-bold text-gray-800">送信完了！</h2>
           <p className="text-gray-600 text-lg">
             お疲れ様でした。<br/>
             本日の業務はすべて完了です。
           </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs mt-8">
           <Button 
              onClick={() => router.push('/preset')} 
              variant="outline" 
              className="w-full bg-white"
            >
              トップ画面へ戻る
            </Button>
            
            <div className="pt-4 border-t border-blue-100/50 text-center space-y-2">
                <p className="text-xs text-blue-600/70 font-bold">デモ用ショートカット</p>
                <Button 
                  onClick={() => router.push('/visitor/trial')} 
                  variant="ghost" 
                  className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-auto py-2 text-sm"
                >
                  [体験画面] ユーザー受信メールのリンク先へ
                </Button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-h-screen bg-gray-50">
      <header className="bg-white border-b p-4 flex items-center shadow-sm shrink-0">
        <button onClick={() => router.back()} className="mr-4 p-1 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-800">一斉送信の確認</h1>
      </header>
      
      <div className="p-6 space-y-8 flex-1 overflow-y-auto pb-24">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent"></div>
          <p className="text-gray-500 mb-2 font-medium">今回の送信対象</p>
          <div className="flex items-baseline justify-center gap-1">
             <span className="text-6xl font-black text-primary tracking-tight">{unsentCount}</span>
             <span className="text-xl text-gray-400 font-bold">名</span>
          </div>
          <p className="text-sm text-gray-400 mt-2">未送信の全訪問者</p>
        </div>

        <div className="space-y-4">
           <h3 className="font-bold text-gray-700 flex items-center gap-2">
             <Mail className="w-4 h-4" />
             使用されるテンプレート
           </h3>
           
           <div className="bg-white p-5 rounded-xl border border-gray-200 text-sm space-y-3 shadow-sm">
             <div className="flex justify-between items-center border-b border-gray-100 pb-2">
               <span className="font-bold text-gray-800">医療職向け</span>
               <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">自動選択</span>
             </div>
             <p className="text-gray-600 leading-relaxed text-xs">
               件名: 【御礼】第57回日本作業療法学会 / CogEvoブース<br/><br/>
               本日はご多忙の中、弊社ブースにお立ち寄りいただき誠にありがとうございました。<br/>
               ご体験いただいた「脳体力チェッカー」の結果はいかがでしたでしょうか？...
             </p>
           </div>

           <div className="bg-white p-5 rounded-xl border border-gray-200 text-sm space-y-3 shadow-sm">
             <div className="flex justify-between items-center border-b border-gray-100 pb-2">
               <span className="font-bold text-gray-800">ビジネス向け</span>
               <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-bold">自動選択</span>
             </div>
             <p className="text-gray-600 leading-relaxed text-xs">
               件名: 【御礼】第57回日本作業療法学会 / 協業のご提案について<br/><br/>
               拝啓 ... 本日は貴重なお時間をいただき...
             </p>
           </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-white border-t shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-20 safe-area-bottom">
        <Button 
          className="w-full h-14 text-lg font-bold bg-accent hover:bg-accent/90 shadow-xl flex items-center justify-center gap-2 disabled:opacity-70"
          onClick={handleSend}
          disabled={isSending || unsentCount === 0}
        >
          {isSending ? (
            <>
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              送信中...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              送信を実行する
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
