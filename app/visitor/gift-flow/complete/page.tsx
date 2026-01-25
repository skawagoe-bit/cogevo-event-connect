"use client";

import { QrCode, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GiftCompletePage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#06C755] font-sans text-white">
      
      {/* Header */}
      <div className="pt-12 px-6 text-center">
        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-500">
          <Check className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold mb-2">連携完了しました！</h1>
        <p className="text-white/80 text-sm">
          友だち追加ありがとうございます。<br/>
          下記の画面をスタッフにお見せください。
        </p>
      </div>

      {/* Ticket Card */}
      <div className="flex-1 px-4 py-8">
        <div className="bg-white rounded-3xl p-6 shadow-2xl text-gray-800 relative overflow-hidden">
          {/* Ticket Cutout Effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 bg-[#06C755] rounded-full -translate-y-1/2"></div>
          
          <div className="text-center space-y-6 pt-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Gift Ticket</p>
              <h2 className="text-xl font-bold">Amazonギフト 500円分</h2>
            </div>

            {/* Mock QR Code */}
            <div className="bg-gray-900 p-4 rounded-xl w-48 h-48 mx-auto flex items-center justify-center shadow-inner relative group">
              <QrCode className="w-32 h-32 text-white" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-xl backdrop-blur-sm">
                <span className="text-white text-xs font-bold">1234-5678-9012</span>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 text-left">
              <p className="text-[10px] text-orange-600 font-bold mb-1">スタッフ確認用コード</p>
              <div className="flex items-center justify-between">
                <code className="text-lg font-mono font-bold text-gray-800">A83K-992L</code>
                <button className="text-gray-400 hover:text-gray-600">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <p className="text-xs text-gray-400 text-center">
              有効期限: 本日限り<br/>
              ※スクリーンショットを保存してください
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 pb-12 text-center">
        <Button 
          variant="outline" 
          className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20"
          onClick={() => window.close()}
        >
          画面を閉じる
        </Button>
      </div>
    </div>
  );
}
