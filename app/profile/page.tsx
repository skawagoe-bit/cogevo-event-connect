"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProfile, updateProfile } from "@/app/actions/profile";

export default function ProfilePage() {
  const router = useRouter();
  const [sansanUrl, setSansanUrl] = useState("");
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const result = await getProfile();
      if (result.success && result.data) {
        setSansanUrl(result.data.sansan_url || "");
        setFullName(result.data.full_name || "");
        setDepartment(result.data.department || "");
      }
      setLoading(false);
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const formData = new FormData();
    formData.append("sansan_url", sansanUrl);
    formData.append("full_name", fullName);
    formData.append("department", department);

    const result = await updateProfile(formData);
    
    if (result.success) {
      alert("保存しました");
      router.back();
    } else {
      alert("保存に失敗しました: " + result.error);
    }
    setSaving(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white border-b p-4 flex items-center gap-3 shadow-sm sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Button>
        <h1 className="text-lg font-bold text-gray-800">プロフィール設定</h1>
      </header>

      <div className="flex-1 p-6 max-w-md mx-auto w-full">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">氏名</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="山田 太郎"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">所属（部署・役職など）</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="営業部 第1課"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Sansanオンライン名刺URL</label>
                <input
                  type="url"
                  value={sansanUrl}
                  onChange={(e) => setSansanUrl(e.target.value)}
                  placeholder="https://ap.sansan.com/v/virtual-cards/..."
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                />
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  Sansanアプリで「オンライン名刺」を開き、URLをコピーして貼り付けてください。<br/>
                  ここで設定したURLが、スキャン画面の「名刺交換QR」として表示されます。
                </p>
              </div>

              {sansanUrl && (
                <div className="p-3 bg-gray-50 rounded-lg border flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-primary" />
                  <a href={sansanUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline truncate block flex-1">
                    {sansanUrl}
                  </a>
                </div>
              )}
            </div>

            <Button 
              onClick={handleSave} 
              className="w-full h-12 text-lg font-bold shadow-lg"
              disabled={saving}
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
