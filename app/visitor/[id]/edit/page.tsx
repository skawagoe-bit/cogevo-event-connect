"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Play, Pause, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getVisitor, updateVisitor } from "@/app/actions/visitors";
import { useSettings } from "@/app/providers";
import { useTranslation } from "@/lib/i18n/context";

export default function EditVisitorPage({ params }: { params: { id: Promise<string> } }) {
  const router = useRouter();
  const { t, dict } = useTranslation();
  const { attributes, segments } = useSettings();
  
  // Unwrap params using React.use() or await (Next.js 15+ allows async params in components, but for client components we usually unwrap or use hook)
  // Actually, in Next.js 15, params is a Promise. But let's handle it safely.
  const [visitorId, setVisitorId] = useState<string | null>(null);

  useEffect(() => {
    params.id.then(setVisitorId);
  }, [params]);

  const [visitor, setVisitor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [selectedAttribute, setSelectedAttribute] = useState<string | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [memo, setMemo] = useState("");

  // Audio Player
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!visitorId) return;

    const loadVisitor = async () => {
      const result = await getVisitor(visitorId);
      if (result.success && result.data) {
        setVisitor(result.data);
        setName(result.data.name || "");
        setCompany(result.data.company || "");
        setEmail(result.data.email || "");
        setSelectedAttribute(result.data.attribute);
        setSelectedSegment(result.data.segment);
        setMemo(result.data.memo || "");
      } else {
        alert("データの取得に失敗しました");
        router.back();
      }
      setLoading(false);
    };
    loadVisitor();
  }, [visitorId, router]);

  const handleSave = async () => {
    if (!selectedAttribute) {
      alert(dict.scan.select_attribute);
      return;
    }

    setSaving(true);
    const formData = new FormData();
    formData.append("id", visitorId!);
    formData.append("name", name);
    formData.append("company", company);
    formData.append("email", email);
    formData.append("attribute", selectedAttribute);
    if (selectedSegment) formData.append("segment", selectedSegment);
    formData.append("memo", memo);
    
    // updateVisitor updates process_status to 'completed' automatically
    const result = await updateVisitor(formData);

    if (result.success) {
      alert(dict.profile.saved);
      router.push("/list");
    } else {
      alert(dict.profile.save_failed + ": " + result.error);
    }
    setSaving(false);
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white border-b p-4 flex items-center gap-3 shadow-sm sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Button>
        <h1 className="text-lg font-bold text-gray-800">{dict.list.edit_visitor}</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="max-w-md mx-auto space-y-6">
          
          {/* Badge Image */}
          {visitor.badge_image_url ? (
            <div className="bg-black rounded-xl overflow-hidden shadow-lg aspect-[3/4] relative group">
              <img 
                src={visitor.badge_image_url} 
                alt="Badge" 
                className="w-full h-full object-contain" 
              />
              <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                {dict.list.badge_photo}
              </div>
            </div>
          ) : (
            <div className="bg-gray-200 rounded-xl aspect-video flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}

          {/* Voice Memo Player */}
          {visitor.voice_memo_url && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
               <audio 
                 ref={audioRef} 
                 src={visitor.voice_memo_url} 
                 onEnded={() => setIsPlaying(false)}
                 className="hidden"
               />
               <Button 
                 onClick={toggleAudio}
                 className={cn(
                    "rounded-full w-12 h-12 flex items-center justify-center transition-all",
                    isPlaying ? "bg-red-500 text-white animate-pulse" : "bg-primary text-white"
                 )}
               >
                 {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
               </Button>
               <div className="flex-1">
                 <p className="text-sm font-bold text-gray-700">{dict.list.play_voice}</p>
                 <p className="text-xs text-gray-500">{isPlaying ? "Playing..." : "Tap to play"}</p>
               </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">{dict.scan.company_name}</label>
                  <input 
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full p-2 border rounded-md text-sm"
                    placeholder="Enter company..."
                  />
               </div>
               <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">{dict.scan.name}</label>
                  <input 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 border rounded-md text-sm"
                    placeholder="Enter name..."
                  />
               </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">{dict.scan.email}</label>
              <input 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded-md text-sm"
                placeholder="Enter email..."
                type="email"
              />
            </div>

            {/* Attributes */}
            <div>
               <label className="text-xs font-bold text-gray-500 mb-2 block flex items-center gap-2">
                 {dict.scan.select_attribute} <span className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded">{dict.common.required}</span>
               </label>
               <div className="flex flex-wrap gap-2">
                 {attributes.map(attr => (
                   <button
                     key={attr}
                     onClick={() => setSelectedAttribute(attr)}
                     className={cn(
                       "px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors",
                       selectedAttribute === attr 
                         ? "bg-primary text-white border-primary" 
                         : "bg-white text-gray-600 border-gray-200"
                     )}
                   >
                     {t(attr)}
                   </button>
                 ))}
               </div>
            </div>

            {/* Segments */}
            <div>
               <label className="text-xs font-bold text-gray-500 mb-2 block">{dict.scan.segment}</label>
               <div className="flex flex-wrap gap-2">
                 {segments.map(seg => (
                   <button
                     key={seg}
                     onClick={() => setSelectedSegment(seg)}
                     className={cn(
                       "px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors",
                       selectedSegment === seg 
                         ? "bg-gray-800 text-white border-gray-800" 
                         : "bg-white text-gray-600 border-gray-200"
                     )}
                   >
                     {t(seg)}
                   </button>
                 ))}
               </div>
            </div>
            
            {/* Memo */}
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">{dict.scan.voice_memo}</label>
              <textarea 
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="w-full p-2 border rounded-md text-sm min-h-[80px]"
                placeholder={dict.scan.memo_placeholder}
              />
            </div>

          </div>

          <Button 
            onClick={handleSave} 
            className="w-full h-14 text-lg font-bold shadow-xl"
            disabled={saving}
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
            {dict.list.update_register}
          </Button>

        </div>
      </div>
    </div>
  );
}
