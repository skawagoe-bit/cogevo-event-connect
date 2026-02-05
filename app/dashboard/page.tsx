"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, TrendingUp, Users, Trophy, Activity, Target, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import { getProfile } from "@/app/actions/profile";

// Mock data
const rankings = [
  { id: 1, name: "佐藤 健一", count: 42, role: "営業1課", trend: "up" },
  { id: 2, name: "鈴木 恵子", count: 38, role: "営業2課", trend: "up" },
  { id: 3, name: "高橋 誠", count: 31, role: "営業1課", trend: "down" },
  { id: 4, name: "田中 太郎", count: 24, role: "開発部", trend: "same" },
];

export default function DashboardPage() {
  const router = useRouter();
  const { dict, t } = useTranslation();
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const fetchProfile = async () => {
        const result = await getProfile();
        if (result.success && result.data) {
            // Prefer full_name, fallback to email local part
            setUserName(result.data.full_name || result.data.email?.split('@')[0] || "");
        }
    };
    fetchProfile();
  }, []);

  return (
    <div className="flex flex-col h-screen max-h-screen bg-gray-50">
      <header className="bg-white border-b p-4 flex items-center justify-between shadow-sm sticky top-0 z-10 shrink-0">
        <div className="flex items-center">
            <button onClick={() => router.back()} className="mr-4 p-1 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div className="flex flex-col">
                <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                {dict.dashboard.title}
                </h1>
                {userName && (
                    <span className="text-xs text-gray-500 font-medium ml-7">
                        {userName} さん
                    </span>
                )}
            </div>
        </div>
        <button 
            onClick={() => router.push('/admin')}
            className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
        >
            <Settings className="w-3.5 h-3.5" />
            管理画面
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Total Stats */}
        <div className="grid grid-cols-2 gap-3">
           <div className="bg-gradient-to-br from-primary to-blue-600 rounded-2xl p-4 text-white shadow-lg shadow-blue-200">
             <div className="flex items-center gap-2 opacity-80 mb-1">
               <Users className="w-4 h-4" />
               <span className="text-xs font-bold">{dict.dashboard.total_count}</span>
             </div>
             <div className="text-4xl font-black tracking-tight">
               186 <span className="text-base font-normal opacity-80">{dict.dashboard.unit_person}</span>
             </div>
             <div className="mt-2 text-xs bg-white/20 inline-block px-2 py-0.5 rounded-full">
               {dict.dashboard.vs_yesterday} +12% 🚀
             </div>
           </div>

           <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
             <div className="flex items-center gap-2 text-gray-500 mb-1">
               <Target className="w-4 h-4" />
               <span className="text-xs font-bold">{dict.dashboard.todays_goal}</span>
             </div>
             <div>
               <div className="text-2xl font-bold text-gray-800">
                 74<span className="text-sm text-gray-400"> / 250</span>
               </div>
               <div className="w-full bg-gray-100 h-2 rounded-full mt-2 overflow-hidden">
                 <div className="bg-accent h-full w-[30%] rounded-full"></div>
               </div>
               <div className="text-[10px] text-gray-400 mt-1 text-right">{dict.dashboard.achievement_rate} 30%</div>
             </div>
           </div>
        </div>

        {/* Ranking */}
        <div className="space-y-4">
          <h2 className="font-bold text-gray-700 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            {dict.dashboard.ranking}
          </h2>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50 overflow-hidden">
            {rankings.map((user, index) => (
              <div key={user.id} className="p-4 flex items-center gap-4">
                <div className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm shrink-0",
                  index === 0 ? "bg-yellow-100 text-yellow-700 border border-yellow-200" :
                  index === 1 ? "bg-gray-100 text-gray-600 border border-gray-200" :
                  index === 2 ? "bg-orange-50 text-orange-700 border border-orange-100" :
                  "text-gray-400"
                )}>
                  {index + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-800 truncate">{user.name}</div>
                  <div className="text-xs text-gray-400">{t(user.role)}</div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-xl text-primary">{user.count}</div>
                  <div className="text-[10px] text-gray-400">{dict.dashboard.unit_count}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
