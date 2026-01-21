"use client";

import { useState } from "react";
import { Play, Clock, CheckCircle, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VisitorTrialPage() {
  const [hasPlayed, setHasPlayed] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-white font-sans">
      {/* Hero Section */}
      <div className="bg-primary pt-12 pb-16 px-6 text-white rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl"></div>
        
        <div className="relative z-10 text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border border-white/20">
            <Clock className="w-3 h-3" />
            <span>残り時間: 6日 23時間</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            ようこそ、<br/>
            田中 太郎 様
          </h1>
          <p className="text-blue-100 text-sm opacity-90 leading-relaxed">
            第57回日本作業療法学会へのご来場、<br/>
            誠にありがとうございました。
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 -mt-8 relative z-20 pb-12">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm text-primary">
               <Brain className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">脳体力チェッカー</h2>
            <p className="text-gray-500 text-sm">
              あなたの「認知機能」の状態を<br/>
              約5分でチェックできます。
            </p>
          </div>

          {!hasPlayed ? (
            <div className="space-y-4 pt-2">
              <Button 
                className="w-full h-14 text-lg font-bold bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20 rounded-xl animate-pulse-slow"
                onClick={() => setHasPlayed(true)}
              >
                <Play className="w-5 h-5 mr-2 fill-current" />
                測定を開始する
                <span className="ml-2 text-xs opacity-70 font-normal">(外部サイトへ)</span>
              </Button>
              <p className="text-xs text-center text-gray-400">
                ※ 音が出ますのでご注意ください
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in zoom-in duration-300">
               <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-center space-y-4">
                 <div className="flex items-center justify-center gap-2 text-blue-700 font-bold text-lg">
                   <CheckCircle className="w-6 h-6" />
                   測定お疲れ様でした
                 </div>
                 <p className="text-gray-700 font-medium leading-relaxed">
                   結果はいかがでしたでしょうか？<br/>
                   <span className="text-sm text-gray-500 mt-2 block">
                     定期的にチェックすることで、<br/>
                     日々の変化に気づくことができます。
                   </span>
                 </p>
               </div>
               
               <div className="text-center">
                 <p className="text-xs text-gray-400 mb-2">結果を保存・共有したい方はこちら</p>
                 <Button className="w-full bg-gray-800 text-white rounded-xl" variant="outline">
                   マイページに保存する
                 </Button>
               </div>
            </div>
          )}
        </div>

        {/* Community Invite */}
        <div className="mt-8 space-y-4">
          <h3 className="text-sm font-bold text-gray-500 px-2">限定コミュニティ</h3>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
             <div className="w-12 h-12 bg-[#06C755] rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm">
                <UsersIcon />
             </div>
             <div className="flex-1">
               <h4 className="font-bold text-gray-800 text-sm">OTのための知見共有会</h4>
               <p className="text-xs text-gray-500 mt-0.5">1,240名が参加中</p>
             </div>
             <Button size="sm" variant="outline" className="h-8 text-xs border-primary/20 text-primary">
               参加する
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UsersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
