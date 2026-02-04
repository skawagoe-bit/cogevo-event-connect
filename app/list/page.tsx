"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Clock, Send, Search, X, Activity, Square, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSettings } from "@/app/providers";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription";
import type { Database } from "@/lib/supabase/types";
import { getVisitors } from "@/app/actions/visitors";
import { useTranslation } from "@/lib/i18n/context";

type Visitor = Database['public']['Tables']['visitors']['Row'];

export default function ListPage() {
  const router = useRouter();
  const { dict, t } = useTranslation();
  const { eventId, attributes } = useSettings();
  const [activeTab, setActiveTab] = useState<'unsent' | 'sent' | 'pending'>('pending');
  const [selectedAttribute, setSelectedAttribute] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Selection state for unsent items
  const [selectedVisitorIds, setSelectedVisitorIds] = useState<string[]>([]);

  // Initial data fetch
  useEffect(() => {
    if (!eventId) {
        const savedEventId = localStorage.getItem("eventId");
        if (!savedEventId) {
             router.push("/preset");
             return;
        }
        // Context will update soon
        return;
    }

    const fetchVisitors = async () => {
      // Use Server Action to bypass RLS for the dummy event ID
      const result = await getVisitors(eventId);
      
      if (result.success) {
        const fetchedVisitors = result.data as Visitor[] || [];
        setVisitors(fetchedVisitors);
        
        // Auto-select Pending tab if there are pending items
        const pendingItems = fetchedVisitors.filter(v => v.process_status === 'pending_entry');
        if (pendingItems.length > 0) {
            setActiveTab('pending');
        } else {
            setActiveTab('unsent');
        }
        
        // Initialize selection (all unsent are selected by default)
        const unsentIds = fetchedVisitors
            .filter(v => !v.is_sent && v.process_status !== 'pending_entry')
            .map(v => v.id);
        setSelectedVisitorIds(unsentIds);

      } else {
        console.error("Fetch visitors error:", result.error);
      }
      setIsLoading(false);
    };

    fetchVisitors();
  }, [eventId, router]);

  // Update selection when visitors change (e.g. realtime update or fetch)
  useEffect(() => {
    // Only add new items to selection, don't re-select unchecked ones if already loaded
    // This is tricky. Simple approach: when data loads initially (isLoading changes), set selection.
    // For realtime, we might want to append.
    // For now, let's keep it simple: initial load sets all. Realtime adds new ones.
  }, [visitors]);

  // Realtime subscription
  useRealtimeSubscription<Visitor>(
    'visitors-list',
    '*',
    'visitors',
    undefined,
    (payload) => {
      if (payload.eventType === 'INSERT') {
        setVisitors((prev) => [payload.new, ...prev]);
        // Add new unsent visitor to selection by default
        if (!payload.new.is_sent && payload.new.process_status !== 'pending_entry') {
            setSelectedVisitorIds(prev => [...prev, payload.new.id]);
        }
      } else if (payload.eventType === 'UPDATE') {
        setVisitors((prev) => 
          prev.map((v) => (v.id === payload.new.id ? payload.new : v))
        );
      } else if (payload.eventType === 'DELETE') {
        setVisitors((prev) => 
          prev.filter((v) => v.id !== payload.old.id)
        );
        setSelectedVisitorIds(prev => prev.filter(id => id !== payload.old.id));
      }
    }
  );
  
  // Filter logic
  const filteredVisitors = visitors.filter(v => {
    // Tab filter
    if (activeTab === 'pending') {
        if (v.process_status !== 'pending_entry') return false;
    } else {
        if (v.process_status === 'pending_entry') return false;
        if (activeTab === 'unsent' && v.is_sent) return false;
        if (activeTab === 'sent' && !v.is_sent) return false;
    }
    
    // Attribute filter
    if (selectedAttribute && v.attribute !== selectedAttribute) return false;
    
    // Search filter
    if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        return (
            (v.name || '').toLowerCase().includes(lowerTerm) || 
            (v.company || '').toLowerCase().includes(lowerTerm)
        );
    }
    
    return true;
  });

  const unsentCount = visitors.filter(v => !v.is_sent && v.process_status !== 'pending_entry').length;
  const sentCount = visitors.filter(v => v.is_sent && v.process_status !== 'pending_entry').length;
  const pendingCount = visitors.filter(v => v.process_status === 'pending_entry').length;

  const handleVisitorClick = (visitor: Visitor) => {
    if (activeTab === 'pending') {
        router.push(`/visitor/${visitor.id}/edit`);
    } else {
        // Toggle selection for unsent items (only if clicking the row, not specific actions)
        if (activeTab === 'unsent') {
            toggleSelection(visitor.id);
        }
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedVisitorIds(prev => 
        prev.includes(id) 
            ? prev.filter(vid => vid !== id)
            : [...prev, id]
    );
  };

  const handleSendMail = () => {
    const targets = filteredVisitors.filter(v => selectedVisitorIds.includes(v.id));
    if (targets.length === 0) {
        alert("送信対象が選択されていません");
        return;
    }
    
    // In a real app, this would go to a bulk send confirmation page or API
    // Passing IDs via URL or State. For now, let's just log or alert.
    const ids = targets.map(v => v.id).join(',');
    router.push(`/send?ids=${ids}`);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push('/scan')}>
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </Button>
            <h1 className="font-bold text-lg text-gray-800">{dict.list.title}</h1>
          </div>
          <div className="flex gap-2">
             <Button variant="ghost" size="icon" onClick={() => setIsFilterOpen(!isFilterOpen)}>
                <Search className={cn("w-5 h-5", isFilterOpen ? "text-primary" : "text-gray-500")} />
             </Button>
          </div>
        </div>
        
        {/* Search Bar */}
        {isFilterOpen && (
            <div className="px-4 pb-4 animate-in slide-in-from-top-2">
                <input
                    type="text"
                    placeholder={dict.list.search_placeholder}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
                />
            </div>
        )}

        {/* Tabs */}
        <div className="flex px-4 border-b overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('pending')}
            className={cn(
              "flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 whitespace-nowrap",
              activeTab === 'pending' 
                ? "border-yellow-500 text-yellow-600" 
                : "border-transparent text-gray-400 hover:text-gray-600"
            )}
          >
            <Clock className="w-4 h-4" />
            {dict.list.tab_pending}
            <span className="ml-1 bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-full">
              {pendingCount}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('unsent')}
            className={cn(
              "flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 whitespace-nowrap",
              activeTab === 'unsent' 
                ? "border-primary text-primary" 
                : "border-transparent text-gray-400 hover:text-gray-600"
            )}
          >
            <Activity className="w-4 h-4" />
            {dict.list.tab_unsent}
            <span className="ml-1 bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-full">
              {unsentCount}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={cn(
              "flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 whitespace-nowrap",
              activeTab === 'sent' 
                ? "border-green-500 text-green-600" 
                : "border-transparent text-gray-400 hover:text-gray-600"
            )}
          >
            <Check className="w-4 h-4" />
            {dict.list.tab_sent}
            <span className="ml-1 bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-full">
              {sentCount}
            </span>
          </button>
        </div>
        
        {/* Attribute Filter (Horizontal Scroll) */}
        <div className="flex gap-2 p-3 overflow-x-auto scrollbar-hide bg-gray-50/50">
            <button
                onClick={() => setSelectedAttribute(null)}
                className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all",
                    !selectedAttribute 
                        ? "bg-gray-800 text-white border-gray-800" 
                        : "bg-white text-gray-500 border-gray-200"
                )}
            >
                {dict.list.filter_all}
            </button>
            {attributes.map(attr => (
                <button
                    key={attr}
                    onClick={() => setSelectedAttribute(attr)}
                    className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all",
                        selectedAttribute === attr 
                            ? "bg-primary text-white border-primary shadow-sm" 
                            : "bg-white text-gray-500 border-gray-200"
                    )}
                >
                    {t(attr)}
                </button>
            ))}
        </div>
      </header>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {isLoading ? (
            <div className="flex justify-center py-10">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
        ) : filteredVisitors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <Search className="w-12 h-12 mb-2 opacity-20" />
                <p className="text-sm">{dict.list.no_results}</p>
            </div>
        ) : (
            <div className="space-y-3">
                {activeTab === 'unsent' && (
                    <div className="text-xs text-gray-500 font-bold px-1">
                        {filteredVisitors.filter(v => selectedVisitorIds.includes(v.id)).length} / {filteredVisitors.length} 件選択中
                    </div>
                )}
                {filteredVisitors.map((visitor) => (
                    <div 
                        key={visitor.id} 
                        className={cn(
                            "bg-white rounded-xl border shadow-sm p-4 active:scale-[0.99] transition-transform",
                            activeTab === 'unsent' && selectedVisitorIds.includes(visitor.id) ? "ring-2 ring-primary ring-offset-1 border-primary/50" : "border-gray-100"
                        )}
                        onClick={() => handleVisitorClick(visitor)}
                    >
                        <div className="flex items-start gap-3">
                            {/* Checkbox for Unsent */}
                            {activeTab === 'unsent' && (
                                <div className="mt-1" onClick={(e) => { e.stopPropagation(); toggleSelection(visitor.id); }}>
                                    {selectedVisitorIds.includes(visitor.id) ? (
                                        <CheckSquare className="w-5 h-5 text-primary" />
                                    ) : (
                                        <Square className="w-5 h-5 text-gray-300" />
                                    )}
                                </div>
                            )}

                            {/* Badge/Icon */}
                            <div className="relative shrink-0">
                                {visitor.badge_image_url || visitor.image_url ? (
                                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
                                        <img 
                                            src={visitor.badge_image_url || visitor.image_url || ""} 
                                            alt="Card" 
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border border-primary/20">
                                        {(visitor.name || "?")[0]}
                                    </div>
                                )}
                                {visitor.process_status === 'pending_entry' && (
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white" />
                                )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-gray-900 truncate pr-2">
                                        {visitor.name || dict.list.name_not_set}
                                    </h3>
                                    <span className="text-[10px] text-gray-400 whitespace-nowrap bg-gray-50 px-1.5 py-0.5 rounded">
                                        {new Date(visitor.created_at).getHours()}:{String(new Date(visitor.created_at).getMinutes()).padStart(2, '0')}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 font-medium truncate mt-0.5">
                                    {visitor.company || dict.list.not_set}
                                </p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700">
                                        {t(visitor.attribute)}
                                    </span>
                                    {visitor.segment && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700">
                                            {t(visitor.segment)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Footer Action */}
      {activeTab === 'unsent' && selectedVisitorIds.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
            <div className="max-w-md mx-auto">
                <Button 
                    className="w-full h-12 text-lg font-bold shadow-lg animate-in slide-in-from-bottom-4"
                    onClick={handleSendMail}
                >
                    <Send className="w-5 h-5 mr-2" />
                    {dict.list.send_mail} ({filteredVisitors.filter(v => selectedVisitorIds.includes(v.id)).length}件)
                </Button>
            </div>
          </div>
      )}
    </div>
  );
}