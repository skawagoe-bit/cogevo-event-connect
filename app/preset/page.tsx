"use client";

import { useRouter } from "next/navigation";
import { Settings, Plus, Calendar, ArrowRight, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";
import { useSettings } from "@/app/providers";
import { useEffect, useState } from "react";
import { getAllEvents } from "@/app/actions/events";
import { cn } from "@/lib/utils";

interface EventItem {
  id: string;
  name: string;
  name_en?: string;
  event_date: string;
  end_date?: string | null;
  attributes_preset?: string[];
  segments_preset?: string[];
  roles_preset?: string[];
}

export default function PresetPage() {
  const router = useRouter();
  const { dict } = useTranslation();
  const { eventId, setEventId, setEventName, setAttributes, setSegments, setRoles } = useSettings();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const result = await getAllEvents();
      if (result.success) {
        setEvents(result.data as EventItem[]);
      }
      setLoading(false);
    };
    fetchEvents();
  }, []);

  const handleSelectEvent = (event: EventItem) => {
    // Save to context and localStorage
    setEventId(event.id);
    setEventName(event.name);
    if (event.attributes_preset) setAttributes(event.attributes_preset);
    if (event.segments_preset) setSegments(event.segments_preset);
    if (event.roles_preset) setRoles(event.roles_preset);
    
    // Also save simplified info to localStorage for persistence across reloads
    localStorage.setItem("eventId", event.id);
    localStorage.setItem("eventName", event.name);
    
    router.push("/scan");
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white border-b p-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Activity className="w-6 h-6 text-primary" />
          {dict.preset.title}
        </h1>
        <Button 
            variant="outline" 
            size="sm" 
            className="text-xs font-bold text-gray-600"
            onClick={() => router.push('/admin')}
        >
            <Settings className="w-3.5 h-3.5 mr-1" />
            管理画面
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex justify-between items-center mb-2">
            <h2 className="font-bold text-gray-700">{dict.preset.select_event}</h2>
            <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary hover:text-primary/80 hover:bg-primary/5"
                onClick={() => router.push('/admin/events')}
            >
                <Plus className="w-4 h-4 mr-1" />
                {dict.preset.create_new}
            </Button>
        </div>

        {loading ? (
          <div className="flex justify-center p-10">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center p-8 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500 mb-4">{dict.preset.no_events}</p>
            <Button onClick={() => router.push('/admin/events')}>
              {dict.preset.create_first}
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {events.map((event) => (
              <button
                key={event.id}
                onClick={() => handleSelectEvent(event)}
                className={cn(
                  "w-full text-left bg-white p-4 rounded-xl border shadow-sm transition-all active:scale-[0.99] flex items-center justify-between group",
                  eventId === event.id 
                    ? "border-primary ring-2 ring-primary/20 bg-primary/5" 
                    : "border-gray-100 hover:border-primary/50 hover:shadow-md"
                )}
              >
                <div>
                  <h3 className="font-bold text-lg text-gray-800 group-hover:text-primary transition-colors">
                    {event.name}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <Calendar className="w-3.5 h-3.5 mr-1.5" />
                    {event.event_date}
                    {event.end_date && ` 〜 ${event.end_date}`}
                  </div>
                </div>
                {eventId === event.id ? (
                    <div className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                        選択中
                    </div>
                ) : (
                    <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
