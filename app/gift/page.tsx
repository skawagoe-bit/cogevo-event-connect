"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Minus, Gift as GiftIcon, Package, Settings, X, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createGift, updateGiftStock, getGifts } from "@/app/actions/gifts";

// 以前のファイルで定義されていた型定義と定数
const CURRENT_EVENT_ID = "123e4567-e89b-12d3-a456-426614174000";

interface GiftItem {
  id: string;
  name: string;
  stock_count: number;
  image_url: string | null;
  is_active: boolean;
  event_id: string;
  created_at: string;
  updated_at: string;
}

export default function GiftPage() {
  const router = useRouter();
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isAddGiftModalOpen, setIsAddGiftModalOpen] = useState(false);
  const [newGiftName, setNewGiftName] = useState("");
  const [newGiftStock, setNewGiftStock] = useState(10);
  const [newGiftImageUrl, setNewGiftImageUrl] = useState("");

  const fetchGifts = async () => {
    setLoading(true);
    // Server Action経由で取得（RLS回避のため）
    const result = await getGifts(CURRENT_EVENT_ID);
    
    if (result.success) {
      setGifts(result.data as GiftItem[] || []);
    } else {
      console.error("Error fetching gifts:", result.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGifts();
  }, []);

  const handleStockChange = async (giftId: string, delta: number) => {
    const currentGift = gifts.find(g => g.id === giftId);
    if (!currentGift) return;

    const newStock = Math.max(0, currentGift.stock_count + delta);
    if (newStock === currentGift.stock_count) return;

    // 楽観的UI更新
    setGifts(prevGifts =>
      prevGifts.map(g => (g.id === giftId ? { ...g, stock_count: newStock } : g))
    );

    const result = await updateGiftStock(giftId, newStock);

    if (!result.success) {
      alert("在庫の更新に失敗しました: " + result.error);
      fetchGifts(); // ロールバック
    }
  };

  const handleAddGift = async () => {
    if (!newGiftName) {
      alert("ギフト名を入力してください");
      return;
    }

    const formData = new FormData();
    formData.append("name", newGiftName);
    formData.append("stock_count", newGiftStock.toString());
    formData.append("event_id", CURRENT_EVENT_ID);
    if (newGiftImageUrl) formData.append("image_url", newGiftImageUrl);

    const result = await createGift(formData);

    if (result.success) {
      setNewGiftName("");
      setNewGiftStock(10);
      setNewGiftImageUrl("");
      setIsAddGiftModalOpen(false);
      fetchGifts();
    } else {
      alert("ギフトの追加に失敗しました: " + result.error);
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b p-3 flex justify-between items-center shadow-sm z-20 shrink-0">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={() => router.back()}
        >
          <X className="w-5 h-5 text-gray-500" />
        </Button>
        <h1 className="text-lg font-bold text-gray-800">ギフト管理</h1>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={() => router.push('/preset')}
        >
          <Settings className="w-5 h-5 text-gray-500" />
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-24 scrollbar-hide">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">在庫一覧</h2>
          <Button onClick={() => setIsAddGiftModalOpen(true)} size="sm" className="bg-primary text-white shadow-md">
            <Plus className="w-4 h-4 mr-1" /> 追加
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : gifts.length === 0 ? (
          <div className="text-center text-gray-500 p-10 border-2 border-dashed border-gray-200 rounded-xl bg-white/50">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="font-bold text-gray-600">ギフトが登録されていません</p>
            <p className="text-sm text-gray-400 mt-1">右上の「追加」ボタンから登録してください</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {gifts.map(gift => (
              <div key={gift.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
                {gift.image_url ? (
                  <img src={gift.image_url} alt={gift.name} className="w-16 h-16 object-cover rounded-lg bg-gray-100" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300">
                    <GiftIcon className="w-8 h-8" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 truncate">{gift.name}</h3>
                  <p className="text-xs text-gray-500">在庫数</p>
                </div>

                <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                  <button 
                    className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 active:scale-95 transition-transform disabled:opacity-50"
                    onClick={() => handleStockChange(gift.id, -1)}
                    disabled={gift.stock_count <= 0}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-lg w-10 text-center tabular-nums text-gray-800">{gift.stock_count}</span>
                  <button 
                    className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 active:scale-95 transition-transform"
                    onClick={() => handleStockChange(gift.id, 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Gift Modal (Custom Implementation) */}
      {isAddGiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setIsAddGiftModalOpen(false)}>
          <div 
            className="bg-white w-full max-w-sm rounded-2xl p-6 space-y-4 animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-800">新規ギフト追加</h3>
              <button onClick={() => setIsAddGiftModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">ギフト名</label>
                <input
                  value={newGiftName}
                  onChange={(e) => setNewGiftName(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="例: オリジナルタオル"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">初期在庫数</label>
                <div className="flex items-center gap-3">
                   <button 
                     onClick={() => setNewGiftStock(Math.max(0, newGiftStock - 10))}
                     className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg text-gray-600 font-bold hover:bg-gray-200"
                   >
                     -10
                   </button>
                   <input
                     type="number"
                     value={newGiftStock}
                     onChange={(e) => setNewGiftStock(parseInt(e.target.value) || 0)}
                     className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-lg text-center font-bold text-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                   />
                   <button 
                     onClick={() => setNewGiftStock(newGiftStock + 10)}
                     className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg text-gray-600 font-bold hover:bg-gray-200"
                   >
                     +10
                   </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">画像URL (任意)</label>
                <input
                  value={newGiftImageUrl}
                  onChange={(e) => setNewGiftImageUrl(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsAddGiftModalOpen(false)}>
                キャンセル
              </Button>
              <Button className="flex-1 bg-primary text-white shadow-md" onClick={handleAddGift} disabled={!newGiftName}>
                登録する
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t p-0 grid grid-cols-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
        <button 
           className="flex flex-col items-center justify-center py-4 gap-1.5 active:bg-gray-50 transition-colors"
           onClick={() => router.push('/list')}
        >
           <div className="relative">
             <List className="w-6 h-6 text-gray-400" />
           </div>
           <span className="text-[10px] font-bold text-gray-400">本日のリスト</span>
        </button>
        <button 
           className="flex flex-col items-center justify-center py-4 gap-1.5 border-l border-gray-100 active:bg-gray-50 transition-colors bg-gray-50/50"
           onClick={() => {}}
        >
           <GiftIcon className="w-6 h-6 text-primary" />
           <span className="text-[10px] font-bold text-primary">ギフト管理</span>
        </button>
      </div>
    </div>
  );
}
