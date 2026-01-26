"use client";

import { useRouter } from "next/navigation";
import { Check, ArrowLeft, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { getGifts, updateGiftStock } from "@/app/actions/gifts";

const CURRENT_EVENT_ID = "123e4567-e89b-12d3-a456-426614174000";

interface GiftItem {
  id: string;
  name: string;
  stock_count: number;
}

export default function CompletePage() {
  const router = useRouter();
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [selectedGiftId, setSelectedGiftId] = useState<string | null>(null);
  const [isGiving, setIsGiving] = useState(false);
  const [giftGiven, setGiftGiven] = useState(false);

  useEffect(() => {
    const fetchGifts = async () => {
      const result = await getGifts(CURRENT_EVENT_ID);
      if (result.success && result.data) {
        setGifts(result.data.filter((g: any) => g.stock_count > 0));
      }
    };
    fetchGifts();
  }, []);

  const handleGiveGift = async () => {
    if (!selectedGiftId) return;
    setIsGiving(true);
    
    const gift = gifts.find(g => g.id === selectedGiftId);
    if (gift) {
      const result = await updateGiftStock(selectedGiftId, gift.stock_count - 1);
      if (result.success) {
        setGiftGiven(true);
      } else {
        alert("ギフトの更新に失敗しました");
      }
    }
    setIsGiving(false);
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-6 bg-gray-50 text-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm space-y-6 animate-in zoom-in-95 duration-300">
        
        {!giftGiven ? (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-800">登録完了</h1>
              <p className="text-gray-500 text-sm">訪問者データが保存されました</p>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <h3 className="font-bold text-gray-800 flex items-center justify-center gap-2 mb-4">
                <Gift className="w-5 h-5 text-primary" />
                ギフトをお渡ししますか？
              </h3>
              
              {gifts.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-2">
                    {gifts.map(gift => (
                      <button
                        key={gift.id}
                        onClick={() => setSelectedGiftId(gift.id)}
                        className={`p-3 rounded-lg border-2 text-sm font-bold transition-all ${
                          selectedGiftId === gift.id 
                            ? "border-primary bg-primary/5 text-primary" 
                            : "border-gray-100 bg-gray-50 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {gift.name} (残: {gift.stock_count})
                      </button>
                    ))}
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleGiveGift} 
                    disabled={!selectedGiftId || isGiving}
                  >
                    {isGiving ? "処理中..." : "ギフトを渡す (在庫消費)"}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-gray-400">渡せるギフトがありません</p>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-6 animate-in fade-in">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Gift className="w-10 h-10 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">お渡し完了！</h2>
              <p className="text-gray-500 text-sm">在庫を更新しました</p>
            </div>
          </div>
        )}

        <div className="pt-4">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => router.push('/scan')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            スキャン画面へ戻る
          </Button>
        </div>
      </div>
    </div>
  );
}