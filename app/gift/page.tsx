"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Gift, Users, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Mock data for gifts
const mockGifts = [
  { id: '1', name: 'CogEvo ステッカー', stock: 45, required: 'SNSフォロー' },
  { id: '2', name: '脳体力あめ', stock: 12, required: 'アンケート回答' },
  { id: '3', name: 'トートバッグ', stock: 0, required: '商談完了' },
];

// Mock data for gift history
const mockHistory = [
  { id: '1', visitorName: '田中 太郎', giftName: 'CogEvo ステッカー', time: '10:35' },
  { id: '2', visitorName: '佐藤 花子', giftName: '脳体力あめ', time: '11:20' },
  { id: '3', visitorName: '高橋 優子', giftName: 'CogEvo ステッカー', time: '13:25' },
];

export default function GiftPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'inventory' | 'history'>('inventory');

  return (
    <div className="flex flex-col h-screen max-h-screen bg-gray-50">
      <header className="bg-white border-b p-4 flex items-center shadow-sm sticky top-0 z-10 shrink-0">
        <button onClick={() => router.back()} className="mr-4 p-1 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Gift className="w-5 h-5 text-accent" />
          ギフト管理
        </h1>
      </header>

      <div className="p-4 flex gap-3 shrink-0">
        <button 
          onClick={() => setActiveTab('inventory')}
          className={cn(
            "flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200",
            activeTab === 'inventory' 
              ? "bg-accent text-white shadow-md ring-2 ring-accent/20" 
              : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
          )}
        >
          在庫・配布
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={cn(
            "flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200",
            activeTab === 'history' 
              ? "bg-gray-800 text-white shadow-md ring-2 ring-gray-800/20" 
              : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
          )}
        >
          配布履歴
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-4">
        {activeTab === 'inventory' ? (
          <>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
               <div className="bg-blue-100 p-2 rounded-full text-blue-600 mt-0.5">
                 <Users className="w-5 h-5" />
               </div>
               <div>
                 <h3 className="font-bold text-blue-900 text-sm">SNS会員証提示でギフト</h3>
                 <p className="text-xs text-blue-700 mt-1">
                   来場者がコミュニティ会員証（LINE/Discord）を提示した場合、以下のギフトをお渡しして「配布する」を押してください。
                 </p>
               </div>
            </div>

            <div className="space-y-3">
              {mockGifts.map(gift => (
                <div key={gift.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-gray-800">{gift.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        条件: {gift.required}
                      </span>
                      {gift.stock === 0 ? (
                        <span className="text-xs text-red-500 font-bold">在庫なし</span>
                      ) : (
                        <span className="text-xs text-gray-500">残り {gift.stock} 個</span>
                      )}
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant={gift.stock > 0 ? "outline" : "ghost"}
                    className={cn(
                      "font-bold",
                      gift.stock > 0 ? "border-accent text-accent hover:bg-accent hover:text-white" : "text-gray-300"
                    )}
                    disabled={gift.stock === 0}
                    onClick={() => {
                        if (gift.stock > 0) alert(`${gift.name} を配布しました`);
                    }}
                  >
                    配布する
                  </Button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-0 divide-y divide-gray-100 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             {mockHistory.map(history => (
               <div key={history.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                 <div className="flex items-center gap-3">
                   <div className="bg-green-50 p-2 rounded-full">
                     <CheckCircle2 className="w-5 h-5 text-green-600" />
                   </div>
                   <div>
                     <div className="font-bold text-gray-800 text-sm">{history.visitorName} 様</div>
                     <div className="text-xs text-gray-500">{history.giftName}</div>
                   </div>
                 </div>
                 <div className="text-xs font-mono text-gray-400">
                   {history.time}
                 </div>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
}
