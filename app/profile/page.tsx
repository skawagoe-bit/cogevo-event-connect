"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Save, Link as LinkIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProfile, updateProfile } from "@/app/actions/profile";

export default function ProfilePage() {
  const router = useRouter();
  const [sansanUrl, setSansanUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const result = await getProfile();
      if (result.success && result.data) {
        setSansanUrl(result.data.sansan_url || "");
      }
      setLoading(false);
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const formData = new FormData();
    formData.append("sansan_url", sansanUrl);

    const result = await updateProfile(formData);
    
    if (result.success) {
      alert("プロフィールを更新しました");
    } else {
      alert("更新エラー: " + result.error);
    }
    setSaving(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white border-b p-4 flex items-center gap-2 shadow-sm z-10">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="w-5 h-5 text-gray-500" />
        </Button>
        <h1 className="text-xl font-bold text-gray-800">プロフィール設定</h1>
      </header>

      <div className="flex-1 p-6 max-w-md mx-auto w-full">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-primary" />
                Sansanオンライン名刺URL
              </label>
              <p className="text-xs text-gray-500">
                あなたのオンライン名刺URLを入力してください。<br/>
                名刺交換QRコードとして表示されます。
              </p>
              <input
                type="url"
                value={sansanUrl}
                onChange={(e) => setSansanUrl(e.target.value)}
                placeholder="https://ap.sansan.com/v/virtual-cards/..."
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-sm"
              />
            </div>

            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="w-full h-12 text-lg font-bold shadow-md"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
              保存する
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
