"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProfile, updateProfile } from "@/app/actions/profile";
import { useTranslation } from "@/lib/i18n/context";
import { OBSIDIAN_FOLDER_KEY, OBSIDIAN_VAULT_KEY } from "@/lib/obsidian";

export default function ProfilePage() {
  const router = useRouter();
  const { dict } = useTranslation();
  const [sansanUrl, setSansanUrl] = useState("");
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [obsidianVault, setObsidianVault] = useState("");
  const [obsidianFolder, setObsidianFolder] = useState("");
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
      
      // Load API Key from local storage
      const savedKey = localStorage.getItem("gemini_api_key");
      if (savedKey) setApiKey(savedKey);
      setObsidianVault(localStorage.getItem(OBSIDIAN_VAULT_KEY) || "");
      setObsidianFolder(localStorage.getItem(OBSIDIAN_FOLDER_KEY) || "");

      setLoading(false);
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    
    // Save API Key to local storage
    if (apiKey) {
        localStorage.setItem("gemini_api_key", apiKey);
    } else {
        localStorage.removeItem("gemini_api_key");
    }
    if (obsidianVault.trim()) {
      localStorage.setItem(OBSIDIAN_VAULT_KEY, obsidianVault.trim());
    } else {
      localStorage.removeItem(OBSIDIAN_VAULT_KEY);
    }
    if (obsidianFolder.trim()) {
      localStorage.setItem(OBSIDIAN_FOLDER_KEY, obsidianFolder.trim());
    } else {
      localStorage.removeItem(OBSIDIAN_FOLDER_KEY);
    }

    const formData = new FormData();
    formData.append("sansan_url", sansanUrl);
    formData.append("full_name", fullName);
    formData.append("department", department);

    const result = await updateProfile(formData);
    
    if (result.success) {
      alert(dict.profile.saved);
      router.back();
    } else {
      alert(`${dict.profile.save_failed}: ${result.error}`);
    }
    setSaving(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white border-b p-4 flex items-center gap-3 shadow-sm sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Button>
        <h1 className="text-lg font-bold text-gray-800">{dict.profile.title}</h1>
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
                <label className="block text-sm font-bold text-gray-700 mb-2">{dict.profile.name}</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={dict.profile.name_placeholder}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{dict.profile.department}</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder={dict.profile.department_placeholder}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{dict.profile.sansan_url}</label>
                <input
                  type="url"
                  value={sansanUrl}
                  onChange={(e) => setSansanUrl(e.target.value)}
                  placeholder="https://ap.sansan.com/v/virtual-cards/..."
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                />
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  {dict.profile.sansan_desc_1}<br/>
                  {dict.profile.sansan_desc_2}
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Google Gemini API Key (任意)</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIza..."
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-sm font-mono"
                />
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  AI解析（名刺の文字起こし）に使用するAPIキーを設定できます。<br/>
                  未設定の場合は共有キーが使用されますが、制限により動作しない場合があります。
                </p>
              </div>

              <div className="pt-2 border-t">
                <p className="text-sm font-bold text-gray-700 mb-3">{dict.profile.obsidian_section}</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{dict.profile.obsidian_vault}</label>
                    <input
                      type="text"
                      value={obsidianVault}
                      onChange={(e) => setObsidianVault(e.target.value)}
                      placeholder={dict.profile.obsidian_vault_placeholder}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-2 leading-relaxed">{dict.profile.obsidian_vault_desc}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{dict.profile.obsidian_folder}</label>
                    <input
                      type="text"
                      value={obsidianFolder}
                      onChange={(e) => setObsidianFolder(e.target.value)}
                      placeholder={dict.profile.obsidian_folder_placeholder}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-2 leading-relaxed">{dict.profile.obsidian_folder_desc}</p>
                  </div>
                </div>
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
              {dict.common.save}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
