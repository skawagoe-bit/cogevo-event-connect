"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, BarChart3, ChevronDown, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/app/providers";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Event = {
  id: string;
  name: string;
  event_date: string;
};

export default function PresetPage() {
  const router = useRouter();
  const { 
    eventName, setEventName, 
    eventId, setEventId,
    attributes, addAttribute, removeAttribute,
    segments, addSegment, removeSegment,
    roles, addRole, removeRole
  } = useSettings();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [newAttribute, setNewAttribute] = useState("");
  const [newSegment, setNewSegment] = useState("");
  const [newRole, setNewRole] = useState("");
  
  // Fetch events on mount
  useEffect(() => {
    const fetchEvents = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('events')
        .select('id, name, event_date')
        .order('event_date', { ascending: false });

      if (error) {
        console.error("Error fetching events:", error);
      } else {
        setEvents(data || []);
      }
      setIsLoadingEvents(false);
    };

    fetchEvents();
  }, []);

  const handleSelectEvent = (event: Event) => {
    setEventId(event.id);
    setEventName(event.name);
    setIsDropdownOpen(false);
  };

  const handleStart = () => {
    if (!eventId) {
      alert("イベントを選択してください");
      return;
    }
    router.push("/scan");
  };

  const handleAddAttribute = () => {
    if (newAttribute.trim()) {
      addAttribute(newAttribute.trim());
      setNewAttribute("");
    }
  };

  const handleAddSegment = () => {
    if (newSegment.trim()) {
      addSegment(newSegment.trim());
      setNewSegment("");
    }
  };

  const handleAddRole = () => {
    if (newRole.trim()) {
      addRole(newRole.trim());
      setNewRole("");
    }
  };

  const handleAttributeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddAttribute();
    }
  };

  const handleSegmentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddSegment();
    }
  };

  const handleRoleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddRole();
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-2rem)] p-6 bg-gray-50/50">
      <header className="mb-6 flex justify-between items-start">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">イベント設定</h2>
            <p className="text-gray-500 text-sm">当日の設定を確認・編集してください</p>
        </div>
        <Button 
            variant="outline" 
            size="sm" 
            className="text-xs bg-white h-9"
            onClick={() => router.push('/dashboard')}
        >
            <BarChart3 className="w-4 h-4 mr-1 text-primary" />
            速報
        </Button>
      </header>
      
      <div className="space-y-8 flex-1 overflow-y-auto pb-6">
        {/* Event Selection */}
        <div className="space-y-2 relative">
          <label className="block text-sm font-bold text-gray-700">イベント選択 <span className="text-red-500">*</span></label>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={cn(
                "w-full p-4 text-left border rounded-xl text-lg flex justify-between items-center transition-all shadow-sm bg-white",
                isDropdownOpen ? "border-primary ring-2 ring-primary/20" : "border-gray-300 hover:border-gray-400",
                !eventId && "text-gray-400"
              )}
            >
              <span className="truncate pr-2">{eventName || "イベントを選択してください"}</span>
              <ChevronDown className={cn("w-5 h-5 text-gray-400 transition-transform", isDropdownOpen && "rotate-180")} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                {isLoadingEvents ? (
                  <div className="p-4 text-center text-gray-400 text-sm">読み込み中...</div>
                ) : events.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 text-sm">開催中のイベントはありません</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {events.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => handleSelectEvent(event)}
                        className="w-full text-left p-4 hover:bg-gray-50 transition-colors flex flex-col gap-1"
                      >
                        <span className="font-bold text-gray-800 block truncate">{event.name}</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {event.event_date}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          {isDropdownOpen && <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />}
        </div>

        {/* Attribute Management */}
        <div className="space-y-3">
            <div className="flex justify-between items-end">
                <label className="block text-sm font-bold text-gray-700">属性マスタ設定</label>
                <span className="text-xs text-gray-400">タップして削除</span>
            </div>
            
            <div className="flex gap-2">
                <input
                    type="text"
                    className="flex-1 p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    value={newAttribute}
                    onChange={(e) => setNewAttribute(e.target.value)}
                    onKeyDown={handleAttributeKeyDown}
                    placeholder="新しい属性を追加 (例: 看護師)"
                />
                <Button onClick={handleAddAttribute} size="icon" className="shrink-0 h-[46px] w-[46px]">
                    <Plus className="w-5 h-5" />
                </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
                {attributes.map((attr) => (
                    <div 
                        key={attr}
                        className="group flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-medium text-gray-700 select-none animate-in fade-in zoom-in duration-200"
                    >
                        {attr}
                        <button 
                            onClick={() => removeAttribute(attr)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-red-50"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>
        </div>

        {/* Role/Tag Management */}
        <div className="space-y-3">
            <div className="flex justify-between items-end">
                <label className="block text-sm font-bold text-gray-700">役割タグ設定</label>
                <span className="text-xs text-gray-400">タップして削除</span>
            </div>
            
            <div className="flex gap-2">
                <input
                    type="text"
                    className="flex-1 p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    onKeyDown={handleRoleKeyDown}
                    placeholder="新しいタグを追加 (例: 決裁者)"
                />
                <Button onClick={handleAddRole} size="icon" className="shrink-0 h-[46px] w-[46px]">
                    <Plus className="w-5 h-5" />
                </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
                {roles.map((role) => (
                    <div 
                        key={role}
                        className="group flex items-center gap-1.5 px-3 py-2 bg-purple-50 border border-purple-100 rounded-lg shadow-sm text-sm font-medium text-purple-800 select-none animate-in fade-in zoom-in duration-200"
                    >
                        {role}
                        <button 
                            onClick={() => removeRole(role)}
                            className="text-purple-400 hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-red-50"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>
        </div>

        {/* Segment Management */}
        <div className="space-y-3">
            <div className="flex justify-between items-end">
                <label className="block text-sm font-bold text-gray-700">区分マスタ設定</label>
                <span className="text-xs text-gray-400">タップして削除</span>
            </div>
            
            <div className="flex gap-2">
                <input
                    type="text"
                    className="flex-1 p-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    value={newSegment}
                    onChange={(e) => setNewSegment(e.target.value)}
                    onKeyDown={handleSegmentKeyDown}
                    placeholder="新しい区分を追加 (例: パートナー)"
                />
                <Button onClick={handleAddSegment} size="icon" className="shrink-0 h-[46px] w-[46px]">
                    <Plus className="w-5 h-5" />
                </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
                {segments.map((seg) => (
                    <div 
                        key={seg}
                        className="group flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-medium text-gray-700 select-none animate-in fade-in zoom-in duration-200"
                    >
                        {seg}
                        <button 
                            onClick={() => removeSegment(seg)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-red-50"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>
        </div>

        {/* Status Panel */}
        <div className="p-5 bg-blue-50 rounded-xl border border-blue-100 space-y-3">
          <h3 className="font-bold text-primary flex items-center gap-2 text-sm">
            システム連携状況
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex justify-between items-center">
              <span>Sansan連携</span>
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">有効</span>
            </li>
            <li className="flex justify-between items-center">
              <span>UTAGE連携</span>
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">有効</span>
            </li>
            <li className="flex justify-between items-center">
              <span>LINE連携</span>
              <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs font-bold">未設定</span>
            </li>
            <li className="flex justify-between items-center">
              <span>オフライン保存</span>
              <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs font-bold">待機中</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-auto pt-4 bg-gray-50/50 sticky bottom-0">
        <Button 
          size="lg" 
          className="w-full text-lg shadow-lg" 
          onClick={handleStart}
          disabled={!eventId}
        >
          {eventId ? "設定を完了して開始" : "イベントを選択してください"}
        </Button>
      </div>
    </div>
  );
}
