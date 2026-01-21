"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CompletePage() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect after 2 seconds
    const timer = setTimeout(() => {
      router.push("/scan");
    }, 2000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-green-50 space-y-6 animate-in fade-in zoom-in duration-300 p-6 text-center">
      <div className="bg-white p-8 rounded-full shadow-xl mb-4 animate-bounce">
        <CheckCircle className="w-24 h-24 text-green-500" />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-green-800">登録完了！</h2>
        <p className="text-gray-600 font-medium">
          SansanとUTAGEに<br/>同期予約しました
        </p>
      </div>

      <div className="pt-8 w-full max-w-xs">
        <Button 
          variant="outline" 
          className="w-full border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800"
          onClick={() => router.push("/scan")}
        >
          すぐに戻る
        </Button>
      </div>
    </div>
  );
}
