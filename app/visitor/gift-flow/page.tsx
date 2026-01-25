"use client";

import { useRouter } from "next/navigation";
import { Gift, CheckCircle, MessageCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LineGiftLpPage() {
  const router = useRouter();

  const handleLogin = () => {
    // 実際はLINE認証URLへリダイレクト
    // 今回はモックなので完了画面へ遷移
    router.push("/visitor/gift-flow/complete");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#06C755]/10 to-white font-sans">
      
      {/* Hero Section */}
      <div className="relative pt-16 pb-12 px-6 text-center">
        <div className="absolute top-0 left-0 w-full h-64 bg-[#06C755] rounded-b-[3rem] -z-10 shadow-lg"></div>
        
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 max-w-md mx-auto relative overflow-hidden">
           {/* Decorative Elements */}
           <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-100 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 blur-2xl"></div>
           <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#06C755]/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl"></div>

           <div className="relative z-10">
             <div className="inline-flex items-center gap-2 bg-[#06C755]/10 text-[#06C755] px-4 py-1.5 rounded-full text-xs font-bold mb-6">
               <Gift className="w-3 h-3" />
               <span>展示会ご来場者様限定</span>
             </div>

             <h1 className="text-2xl font-bold text-gray-800 leading-tight mb-4">
               アンケート回答不要！<br/>
               <span className="text-[#06C755]">Amazonギフト 500円分</span><br/>
               今すぐプレゼント 🎁
             </h1>

             <p className="text-gray-500 text-sm mb-8">
               面倒なフォーム入力はありません。<br/>
               LINE友だち追加だけで、すぐに受け取れます。
             </p>

             <Button 
               onClick={handleLogin}
               className="w-full h-16 text-lg font-bold bg-[#06C755] hover:bg-[#05b34c] text-white shadow-lg shadow-[#06C755]/30 rounded-xl flex items-center justify-center gap-3 transition-transform active:scale-95"
             >
               <MessageCircle className="w-6 h-6 fill-current" />
               LINEで受け取る
             </Button>
             
             <p className="mt-4 text-[10px] text-gray-400">
               ※ 認証時に許可を求める画面が表示されます
             </p>
           </div>
        </div>
      </div>

      {/* Merits */}
      <div className="px-6 pb-12 max-w-md mx-auto space-y-8">
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-gray-800">3つのメリット</h2>
          <div className="h-1 w-12 bg-[#06C755] mx-auto rounded-full"></div>
        </div>

        <div className="grid gap-4">
          <MeritItem 
            icon={<CheckCircle className="w-6 h-6 text-[#06C755]" />}
            title="フォーム入力ゼロ"
            desc="お名前やメールアドレスの入力は一切不要です。"
          />
          <MeritItem 
            icon={<Gift className="w-6 h-6 text-orange-500" />}
            title="その場で交換"
            desc="QRコードを表示して、ブースですぐにギフトをお渡しします。"
          />
          <MeritItem 
            icon={<ShieldCheck className="w-6 h-6 text-blue-500" />}
            title="安心・安全"
            desc="LINE公式アカウントと連携するだけ。いつでもブロック可能です。"
          />
        </div>
      </div>

      <footer className="mt-auto py-6 text-center text-xs text-gray-400 border-t bg-gray-50">
        © 2026 CogEvo Event Connect
      </footer>
    </div>
  );
}

function MeritItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-start gap-4">
      <div className="p-3 bg-gray-50 rounded-lg shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-gray-800 mb-1">{title}</h3>
        <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
