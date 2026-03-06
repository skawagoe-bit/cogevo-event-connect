"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Play, Pause, Loader2, Mic, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getVisitor, updateVisitor } from "@/app/actions/visitors";
import { useSettings } from "@/app/providers";
import { useTranslation } from "@/lib/i18n/context";
import {
  OBSIDIAN_FOLDER_KEY,
  OBSIDIAN_VAULT_KEY,
  buildObsidianFilePath,
  buildObsidianNewNoteUri,
  buildVisitorNoteMarkdown,
} from "@/lib/obsidian";

export default function EditVisitorPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { t, dict } = useTranslation();
  const { attributes, segments, eventName } = useSettings();
  
  // Unwrap params using React.use()
  const { id: visitorId } = use(params);

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

  // Voice Memo State for Edit Page
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("このブラウザは音声入力をサポートしていません");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'ja-JP'; // Or use current language context if needed
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          setMemo(prev => prev + (prev ? " " : "") + finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    }
  };

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

    // Email validation
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert(dict.profile.invalid_email);
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

  const handleExportToObsidian = () => {
    const vault = localStorage.getItem(OBSIDIAN_VAULT_KEY)?.trim();
    if (!vault) {
      alert(dict.profile.obsidian_vault_required);
      router.push("/profile");
      return;
    }

    try {
      const folder = localStorage.getItem(OBSIDIAN_FOLDER_KEY) || "";
      const markdown = buildVisitorNoteMarkdown({
        eventName,
        company,
        name,
        email,
        attribute: selectedAttribute,
        segment: selectedSegment,
        memo,
        visitDate: visitor?.visit_date,
      });
      const filePath = buildObsidianFilePath({
        folder,
        visitDate: visitor?.visit_date,
        company,
        name,
      });
      const uri = buildObsidianNewNoteUri({
        vault,
        filePath,
        content: markdown,
      });

      window.location.href = uri;
    } catch (error) {
      console.error("Failed to open Obsidian URI", error);
      alert(dict.profile.obsidian_open_failed);
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
              <label className="text-xs font-bold text-gray-500 mb-1 flex items-center justify-between">
                <span>{dict.scan.voice_memo}</span>
                <button 
                    onClick={toggleVoiceInput}
                    className={cn(
                        "text-xs px-2 py-1 rounded-full flex items-center gap-1 transition-colors",
                        isListening ? "bg-red-100 text-red-600 animate-pulse" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                >
                    <Mic className="w-3 h-3" />
                    {isListening ? dict.scan.listening : "音声入力"}
                </button>
              </label>
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

          <Button
            type="button"
            variant="outline"
            onClick={handleExportToObsidian}
            className="w-full h-12 text-base font-bold border-primary text-primary"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            {dict.list.export_obsidian}
          </Button>

        </div>
      </div>
    </div>
  );
}
