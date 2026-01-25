"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, Trophy, Activity, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";

// Types
type Visitor = {
  id: string;
  scanned_at: string;
  events: {
    user_id: string;
    users: {
      full_name: string | null;
      email: string;
    } | null;
  } | null;
};

type RankingItem = {
  id: string;
  name: string;
  count: number;
  role: string;
};

type DashboardStats = {
  totalCount: number;
  todayCount: number;
  yesterdayCount: number;
  dayOverDayGrowth: number | null; // 前日比（%）
  rankings: RankingItem[];
};

const DAILY_GOAL = 100; // 本日の目標獲得数

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalCount: 0,
    todayCount: 0,
    yesterdayCount: 0,
    dayOverDayGrowth: null,
    rankings: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    const supabase = createClient();
    
    // Fetch all visitors with related user info
    // Note: In a real large-scale app, we would use aggregations or RPC
    const { data, error } = await supabase
      .from('visitors')
      .select(`
        id,
        scanned_at,
        events (
          user_id,
          users (
            full_name,
            email
          )
        )
      `);

    if (error) {
      console.error('Error fetching dashboard stats:', error);
      setIsLoading(false);
      return;
    }

    const visitors = data as unknown as Visitor[];
    
    // Calculate Stats
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = new Date(today - 86400000).getTime();
    const tomorrow = new Date(today + 86400000).getTime();

    let total = 0;
    let todayCnt = 0;
    let yesterdayCnt = 0;
    const userCounts: Record<string, { name: string, count: number }> = {};

    visitors.forEach(v => {
      total++;
      const scanTime = new Date(v.scanned_at).getTime();

      // Daily counts
      if (scanTime >= today && scanTime < tomorrow) {
        todayCnt++;
      } else if (scanTime >= yesterday && scanTime < today) {
        yesterdayCnt++;
      }

      // Ranking aggregation
      // user_id is in v.events.user_id, name is in v.events.users.full_name
      if (v.events?.user_id) {
        const uid = v.events.user_id;
        const name = v.events.users?.full_name || v.events.users?.email || '不明なユーザー';
        
        if (!userCounts[uid]) {
          userCounts[uid] = { name, count: 0 };
        }
        userCounts[uid].count++;
      }
    });

    // Growth calculation
    let growth: number | null = null;
    if (yesterdayCnt > 0) {
      growth = Math.round(((todayCnt - yesterdayCnt) / yesterdayCnt) * 100);
    } else if (todayCnt > 0) {
      growth = 100; // 昨日は0で今日はある場合
    }

    // Format Rankings
    const rankingList: RankingItem[] = Object.entries(userCounts)
      .map(([id, val]) => ({
        id,
        name: val.name,
        count: val.count,
        role: "スタッフ", // DBに情報がないため固定
      }))
      .sort((a, b) => b.count - a.count); // 降順

    setStats({
      totalCount: total,
      todayCount: todayCnt,
      yesterdayCount: yesterdayCnt,
      dayOverDayGrowth: growth,
      rankings: rankingList,
    });
    setIsLoading(false);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Realtime subscription
  // 変更があったら再集計する（シンプルかつ確実な方法）
  useRealtimeSubscription(
    'dashboard-stats',
    '*',
    'visitors',
    undefined,
    (payload) => {
      // INSERT, UPDATE, DELETE すべての場合で再取得
      console.log('Realtime update received:', payload.eventType);
      fetchStats();
    }
  );

  // 目標達成率
  const achievementRate = Math.min(Math.round((stats.todayCount / DAILY_GOAL) * 100), 100);

  return (
    <div className="flex flex-col h-screen max-h-screen bg-gray-50">
      <header className="bg-white border-b p-4 flex items-center shadow-sm sticky top-0 z-10 shrink-0">
        <button onClick={() => router.back()} className="mr-4 p-1 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          リアルタイム速報
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Total Stats */}
        <div className="grid grid-cols-2 gap-3">
           <div className="bg-gradient-to-br from-primary to-blue-600 rounded-2xl p-4 text-white shadow-lg shadow-blue-200">
             <div className="flex items-center gap-2 opacity-80 mb-1">
               <Users className="w-4 h-4" />
               <span className="text-xs font-bold">総獲得数</span>
             </div>
             <div className="text-4xl font-black tracking-tight">
               {isLoading ? "-" : stats.totalCount} <span className="text-base font-normal opacity-80">名</span>
             </div>
             <div className="mt-2 text-xs bg-white/20 inline-block px-2 py-0.5 rounded-full">
               前日比 {stats.dayOverDayGrowth !== null ? (stats.dayOverDayGrowth > 0 ? `+${stats.dayOverDayGrowth}% 🚀` : `${stats.dayOverDayGrowth}%`) : '-'}
             </div>
           </div>

           <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col justify-between">
             <div className="flex items-center gap-2 text-gray-500 mb-1">
               <Target className="w-4 h-4" />
               <span className="text-xs font-bold">本日の目標</span>
             </div>
             <div>
               <div className="text-2xl font-bold text-gray-800">
                 {isLoading ? "-" : stats.todayCount}<span className="text-sm text-gray-400"> / {DAILY_GOAL}</span>
               </div>
               <div className="w-full bg-gray-100 h-2 rounded-full mt-2 overflow-hidden">
                 <div 
                    className="bg-accent h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${achievementRate}%` }}
                 ></div>
               </div>
               <div className="text-[10px] text-gray-400 mt-1 text-right">達成率 {achievementRate}%</div>
             </div>
           </div>
        </div>

        {/* Ranking */}
        <div className="space-y-4">
          <h2 className="font-bold text-gray-700 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            個人ランキング
          </h2>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50 overflow-hidden">
            {isLoading ? (
                <div className="p-8 text-center text-gray-400 text-sm">読み込み中...</div>
            ) : stats.rankings.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">データがありません</div>
            ) : (
                stats.rankings.map((user, index) => (
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
                    <div className="text-xs text-gray-400">{user.role}</div>
                    </div>

                    <div className="text-right">
                    <div className="font-bold text-xl text-primary">{user.count}</div>
                    <div className="text-[10px] text-gray-400">件</div>
                    </div>
                </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
