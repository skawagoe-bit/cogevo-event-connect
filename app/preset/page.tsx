"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, BarChart3, Settings, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/app/providers";
import { getEventsByMonth } from "@/app/actions/events";
import { useTranslation } from "@/lib/i18n/context";

export default function PresetPage() {
  const router = useRouter();
  const { dict } = useTranslation();
  const { 
    eventId, setEventId,
    eventName, setEventName, 
    attributes, setAttributes, 
    segments, setSegments, 
    roles, setRoles,
  } = useSettings();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [targetMonth, setTargetMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [events, setEvents] = useState<any[]>([]);
  
  // Fetch events when month changes
  useEffect(() => {
    const fetchEvents = async () => {
      // Use Server Action instead of client-side fetch to avoid RLS issues
      const result = await getEventsByMonth(targetMonth);

      if (result.success) {
        setEvents(result.data || []);
      } else {
        console.error("Error fetching events:", result.error);
        setEvents([]);
      }
    };

    fetchEvents();
  }, [targetMonth]);

  const handleEventSelect = (event: any) => {
    setEventId(event.id);
    setEventName(event.name);
    
    // Load presets if available
    // Always update attributes, falling back to empty array if not present.
    // However, if the array is empty, the user cannot select any attribute in ScanPage.
    // We should probably ensure at least "その他" exists or handle it in ScanPage.
    if (event.attributes_preset && event.attributes_preset.length > 0) {
      setAttributes(event.attributes_preset as string[]);
    } else {
        // Fallback to default if empty to prevent UI lockout
        setAttributes(["その他"]);
    }

    if (event.segments_preset && event.segments_preset.length > 0) {
      setSegments(event.segments_preset as string[]);
    } else {
      setSegments([]);
    }

    if (event.roles_preset && event.roles_preset.length > 0) {
      setRoles(event.roles_preset as string[]);
    } else {
      setRoles([]);
    }
  };

  const handleStart = () => {
    if (!eventId && !eventName) {
      alert(dict.preset.alert_select_event);
      return;
    }
    router.push("/scan");
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-2rem)] p-6 bg-gray-50/50">
      <header className="mb-6 flex justify-between items-start">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">{dict.preset.title}</h2>
            <p className="text-gray-500 text-sm">{dict.preset.subtitle}</p>
        </div>
        <div className="flex gap-2">
            <a 
                href="https://acrobat.adobe.com/id/urn:aaid:sc:AP:26289790-2cc1-4029-b50b-990ddfbff97d" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-white hover:bg-accent hover:text-accent-foreground h-9 px-3"
            >
                <BookOpen className="w-4 h-4 mr-1 text-blue-500" />
                {dict.common.manual}
            </a>
            <Button 
                variant="outline" 
                size="sm" 
                className="text-xs bg-white h-9"
                onClick={() => router.push('/admin/events')}
            >
                <Settings className="w-4 h-4 mr-1 text-gray-500" />
                {dict.common.management}
            </Button>
            <Button 
                variant="outline" 
                size="sm" 
                className="text-xs bg-white h-9"
                onClick={() => router.push('/dashboard')}
            >
                <BarChart3 className="w-4 h-4 mr-1 text-primary" />
                {dict.common.report}
            </Button>
        </div>
      </header>
      
      <div className="space-y-8 flex-1 overflow-y-auto pb-6">
        {/* Month Selector */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">{dict.preset.month}</label>
          <input
            type="month"
            className="w-full p-4 border border-gray-300 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
            value={targetMonth}
            onChange={(e) => setTargetMonth(e.target.value)}
          />
        </div>

        {/* Event List */}
        <div className="space-y-3">
          <label className="block text-sm font-bold text-gray-700">{dict.preset.event_list}</label>
          {events.length === 0 ? (
            <div className="p-6 text-center text-gray-400 bg-white border border-dashed border-gray-300 rounded-xl">
              {dict.preset.no_events}
            </div>
          ) : (
            <div className="grid gap-3">
              {events.map((event) => (
                <button
                  key={event.id}
                  onClick={() => handleEventSelect(event)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                    eventId === event.id
                      ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="font-bold text-lg text-gray-800">{event.name}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {new Date(event.event_date).toLocaleDateString('ja-JP')}
                  </div>
                  {eventId === event.id && (
                    <div className="mt-2 text-xs font-bold text-primary flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                      {dict.preset.selected}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Current Settings Preview */}
        <div className="p-5 bg-white rounded-xl border border-gray-200 space-y-4 shadow-sm">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
            <Settings className="w-4 h-4 text-gray-500" />
            {dict.preset.current_settings}
          </h3>
          
          <div className="space-y-3">
            <div>
              <span className="text-xs font-bold text-gray-500 block mb-1">{dict.preset.event_name}</span>
              <div className="font-bold text-gray-800">{eventName || dict.preset.unselected}</div>
            </div>
            
            <div>
              <span className="text-xs font-bold text-gray-500 block mb-1">{dict.preset.attributes} ({attributes.length})</span>
              <div className="flex flex-wrap gap-1">
                {attributes.map(a => (
                  <span key={a} className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{a}</span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-gray-500 block mb-1">{dict.preset.roles} ({roles.length})</span>
              <div className="flex flex-wrap gap-1">
                {roles.map(r => (
                  <span key={r} className="text-xs bg-purple-50 px-2 py-1 rounded text-purple-700">{r}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-4 bg-gray-50/50 sticky bottom-0">
        <Button 
          size="lg" 
          className="w-full text-lg shadow-lg" 
          onClick={handleStart}
          disabled={!eventName}
        >
          {dict.common.start}
        </Button>
      </div>
    </div>
  );
}
