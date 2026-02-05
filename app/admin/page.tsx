import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Home } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">管理画面</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl w-full">
        <Link href="/admin/events" className="block group">
          <div className="bg-white p-8 rounded-2xl shadow-sm border hover:shadow-md transition-all h-full flex flex-col items-center text-center group-hover:border-primary/50">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">イベント管理</h2>
            <p className="text-gray-500 text-sm">
              展示会・イベントの作成、編集、削除を行います。
              プリセットやテンプレートの設定もこちらから。
            </p>
          </div>
        </Link>

        <Link href="/admin/users" className="block group">
          <div className="bg-white p-8 rounded-2xl shadow-sm border hover:shadow-md transition-all h-full flex flex-col items-center text-center group-hover:border-primary/50">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-100 transition-colors">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">ユーザー管理</h2>
            <p className="text-gray-500 text-sm">
              システムを利用できるユーザー（社員）を招待・管理します。
            </p>
          </div>
        </Link>
      </div>

      <div className="mt-12">
        <Link href="/">
          <Button variant="ghost" className="text-gray-500 hover:text-gray-700">
            <Home className="w-4 h-4 mr-2" />
            トップページに戻る
          </Button>
        </Link>
      </div>
    </div>
  );
}
