'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Minus, Package, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { createGift, updateStock } from "@/app/actions/gifts";

// ダミーイベントID（本来はContextなどから取得）
const EVENT_ID = '123e4567-e89b-12d3-a456-426614174000';

type GiftItem = {
  id: string;
  name: string;
  stock_count: number;
};

export default function GiftPage() {
  const router = useRouter();
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newGiftName, setNewGiftName] = useState("");
  const [newGiftStock, setNewGiftStock] = useState(10);

  useEffect(() => {
    fetchGifts();
  }, []);

  const fetchGifts = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('gift_items')
      .select('*')
      .eq('event_id', EVENT_ID)
      .order('created_at', { ascending: false });
    
    if (data) setGifts(data);
  };

  const handleCreate = async () => {
    if (!newGiftName) return;
    
    const formData = new FormData();
    formData.append('name', newGiftName);
    formData.append('stock_count', newGiftStock.toString());
    formData.append('event_id', EVENT_ID);

    await createGift(formData);
    setNewGiftName("");
    setNewGiftStock(10);
    setIsAdding(false);
    fetchGifts();
  };

  const handleStockUpdate = async (id: string, delta: number) => {
    // 楽観的UI更新
    setGifts(prev => prev.map(g => 
      g.id === id ? { ...g, stock_count: Math.max(0, g.stock_count + delta) } : g
    ));
    
    await updateStock(id, delta);
    fetchGifts(); // 念のため再取得
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-gray-50">
      <header className="bg-white border-b p-4 flex items-center gap-4 sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-bold text-lg">ギフト在庫管理</h1>
      </header>

      <div className="flex-1 p-4 overflow-y-auto pb-24">
        {gifts.length === 0 ? (
          <div className="text-center text-gray-400 py-10">
            <Package className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>ギフトが登録されていません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {gifts.map(gift => (
              <div key={gift.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-800">{gift.name}</h3>
                  <p className="text-xs text-gray-400">現在庫</p>
                </div>
                
                <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                  <button 
                    onClick={() => handleStockUpdate(gift.id, -1)}
                    className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 active:scale-95 transition-transform"
                    disabled={gift.stock_count <= 0}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-lg w-8 text-center">{gift.stock_count}</span>
                  <button 
                    onClick={() => handleStockUpdate(gift.id, 1)}
                    className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 active:scale-95 transition-transform"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t safe-area-bottom">
        {isAdding ? (
          <div className="space-y-4 bg-gray-50 p-4 rounded-xl animate-in slide-in-from-bottom-10">
            <h3 className="font-bold text-sm text-gray-700">新規ギフト登録</h3>
            <input
              type="text"
              placeholder="ギフト名 (例: ボールペン)"
              className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none"
              value={newGiftName}
              onChange={(e) => setNewGiftName(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-600">初期在庫: {newGiftStock}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setNewGiftStock(Math.max(0, newGiftStock - 10))}>-10</Button>
                <Button size="sm" variant="outline" onClick={() => setNewGiftStock(newGiftStock + 10)}>+10</Button>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsAdding(false)}>キャンセル</Button>
              <Button className="flex-1" onClick={handleCreate} disabled={!newGiftName}>登録</Button>
            </div>
          </div>
        ) : (
          <Button className="w-full h-12 text-lg font-bold" onClick={() => setIsAdding(true)}>
            <Plus className="w-5 h-5 mr-2" /> 新規ギフト追加
          </Button>
        )}
      </div>
    </div>
  );
}
