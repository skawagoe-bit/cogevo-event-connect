"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Clock, Send, Search, X, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockVisitors } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useSettings } from "@/app/providers";

export default function ListPage() {
  const router = useRouter();
  const { attributes } = useSettings();
  const [activeTab, setActiveTab] = useState<'unsent' | 'sent'>('unsent');
  const [selectedAttribute, setSelectedAttribute] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Filter logic
  const filteredVisitors = mockVisitors.filter(v => {
    // Tab filter
    if (activeTab === 'unsent' && v.isSent) return false;
    if (activeTab === 'sent' && !v.isSent) return false;
    
    // Attribute filter
    if (selectedAttribute && v.attribute !== selectedAttribute) return false;
    
    // Search filter
    if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        return (
            v.name.toLowerCase().includes(lowerTerm) || 
            v.company.toLowerCase().includes(lowerTerm)
        );
    }
    
    return true;
  });

  const unsentCount = mockVisitors.filter(v => !v.isSent).length;
  const sentCount = mockVisitors.filter(v => v.isSent).length;

  return (
    <div className="flex flex-col h-screen max-h-screen bg-gray-50">
      <header className="bg-white border-b p-4 flex items-center shadow-sm sticky top-0 z-10 shrink-0">
        <button onClick={() => router.back()} className="mr-4 p-1 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-800">本日の登録 ({mockVisitors.length})</h1>
        <button 
           onClick={() => router.push('/dashboard')}
           className="ml-auto p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors"
        >
           <Activity className="w-5 h-5" />
        </button>
        <button 
           onClick={() => setIsFilterOpen(!isFilterOpen)} 
           className={cn(
               "ml-2 p-2 rounded-full transition-colors",
               isFilterOpen || selectedAttribute || searchTerm ? "bg-blue-50 text-primary" : "text-gray-500 hover:bg-gray-100"
           )}
        >
            <Search className="w-5 h-5" />
        </button>
      </header>
      
      {/* Filter Panel */}
      {(isFilterOpen || selectedAttribute || searchTerm) && (
        <div className="bg-white border-b p-4 space-y-3 animate-in slide-in-from-top-2">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="名前や会社名で検索..." 
                    className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                    <button 
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <button
                    onClick={() => setSelectedAttribute(null)}
                    className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-colors",
                        !selectedAttribute 
                            ? "bg-gray-800 text-white border-gray-800" 
                            : "bg-white text-gray-600 border-gray-200"
                    )}
                >
                    すべて
                </button>
                {attributes.map(attr => (
                    <button
                        key={attr}
                        onClick={() => setSelectedAttribute(selectedAttribute === attr ? null : attr)}
                        className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-colors",
                            selectedAttribute === attr 
                                ? "bg-primary text-white border-primary" 
                                : "bg-white text-gray-600 border-gray-200"
                        )}
                    >
                        {attr}
                    </button>
                ))}
            </div>
        </div>
      )}

      <div className="p-4 flex gap-3 shrink-0">
        <button 
          onClick={() => setActiveTab('unsent')}
          className={cn(
            "flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 flex justify-center items-center gap-2",
            activeTab === 'unsent' 
              ? "bg-primary text-white shadow-md ring-2 ring-primary/20" 
              : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
          )}
        >
          <span>未送信</span>
          <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full min-w-[20px]",
              activeTab === 'unsent' ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
          )}>{unsentCount}</span>
        </button>
        <button 
          onClick={() => setActiveTab('sent')}
          className={cn(
            "flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 flex justify-center items-center gap-2",
            activeTab === 'sent' 
              ? "bg-gray-800 text-white shadow-md ring-2 ring-gray-800/20" 
              : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
          )}
        >
          <span>送信済</span>
          <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full min-w-[20px]",
              activeTab === 'sent' ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
          )}>{sentCount}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-3">
        {filteredVisitors.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm">
            <span className="mb-2 block text-2xl">🔍</span>
            条件に一致するデータはありません
          </div>
        ) : (
          filteredVisitors.map(visitor => (
            <div key={visitor.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group active:scale-[0.99] transition-transform duration-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-gray-800 text-lg">{visitor.name}</span>
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
                    visitor.attribute === '医師' ? "bg-blue-100 text-blue-700" :
                    visitor.attribute === 'PT' || visitor.attribute === 'OT' || visitor.attribute === 'ST' ? "bg-green-100 text-green-700" :
                    "bg-gray-100 text-gray-600"
                  )}>
                    {visitor.attribute}
                  </span>
                </div>
                <div className="text-sm text-gray-500 font-medium">{visitor.company}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                 {visitor.isSent ? (
                   <span className="text-green-600 text-xs font-bold flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                     <Check className="w-3 h-3" /> 送信済
                   </span>
                 ) : (
                   <span className="text-orange-500 text-xs font-bold flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-full border border-orange-100">
                     <Clock className="w-3 h-3" /> 未送信
                   </span>
                 )}
              </div>
            </div>
          ))
        )}
      </div>

      {activeTab === 'unsent' && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-white border-t shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-20 safe-area-bottom">
          <Button 
             className="w-full text-lg font-bold bg-accent hover:bg-accent/90 h-14 shadow-lg flex items-center justify-center gap-2"
             onClick={() => router.push("/send")}
             disabled={unsentCount === 0}
          >
            <Send className="w-5 h-5" />
            一斉送信を確認する
          </Button>
        </div>
      )}
    </div>
  );
}
