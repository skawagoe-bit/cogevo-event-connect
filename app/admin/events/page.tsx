"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Edit, Trash2, ChevronLeft, Save, Calendar, Tag, Layers, Users, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllEvents, createEvent, updateEvent, deleteEvent } from "@/app/actions/events";

interface EventItem {
  id: string;
  name: string;
  event_date: string;
  attributes_preset?: string[];
  segments_preset?: string[];
  roles_preset?: string[];
  email_templates?: Record<string, { subject: string; body: string }>;
}

export default function AdminEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [attributes, setAttributes] = useState<string[]>([]);
  const [segments, setSegments] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  // Email templates state: map segment name to template
  const [emailTemplates, setEmailTemplates] = useState<Record<string, { subject: string; body: string }>>({});
  const [selectedTemplateSegment, setSelectedTemplateSegment] = useState<string>("");
  
  // Temporary state for adding new tags
  const [newAttribute, setNewAttribute] = useState("");
  const [newSegment, setNewSegment] = useState("");
  const [newRole, setNewRole] = useState("");

  const fetchEvents = async () => {
    setLoading(true);
    const result = await getAllEvents();
    if (result.success) {
      setEvents(result.data as EventItem[]);
    } else {
      console.error("Failed to fetch events:", result.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const resetForm = () => {
    setName("");
    setEventDate(new Date().toISOString().slice(0, 10));
    setAttributes(["医師", "看護師", "PT", "OT", "ST", "事務長", "施設長", "その他"]);
    setSegments(["パートナー", "既存顧客", "新規リード", "競合"]);
    setRoles(["決裁者", "担当者", "導入検討中", "情報収集"]);
    setEmailTemplates({});
    setSelectedTemplateSegment("");
    setEditingEvent(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    // Default selected segment for template editing
    setSelectedTemplateSegment("新規リード");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (event: EventItem) => {
    setEditingEvent(event);
    setName(event.name);
    setEventDate(event.event_date.slice(0, 10)); // YYYY-MM-DD
    setAttributes(event.attributes_preset || []);
    setSegments(event.segments_preset || []);
    setRoles(event.roles_preset || []);
    setEmailTemplates(event.email_templates || {});
    // Default selected segment to the first one available or fallback
    setSelectedTemplateSegment((event.segments_preset && event.segments_preset[0]) || "新規リード");
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("本当にこのイベントを削除しますか？関連するデータも削除される可能性があります。")) return;
    
    const result = await deleteEvent(id);
    if (result.success) {
      setEvents(prev => prev.filter(e => e.id !== id));
    } else {
      alert("削除に失敗しました: " + result.error);
    }
  };

  const handleSave = async () => {
    if (!name || !eventDate) {
      alert("イベント名と開催日は必須です");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("event_date", eventDate);
    formData.append("attributes_preset", JSON.stringify(attributes));
    formData.append("segments_preset", JSON.stringify(segments));
    formData.append("roles_preset", JSON.stringify(roles));
    
    console.log("Saving email templates:", emailTemplates);
    formData.append("email_templates", JSON.stringify(emailTemplates));

    let result;
    if (editingEvent) {
      result = await updateEvent(editingEvent.id, formData);
    } else {
      result = await createEvent(formData);
    }

    if (result.success) {
      setIsModalOpen(false);
      fetchEvents();
    } else {
      alert("保存に失敗しました: " + result.error);
    }
  };

  const addTag = (value: string, setter: React.Dispatch<React.SetStateAction<string[]>>, clearer: React.Dispatch<React.SetStateAction<string>>) => {
    if (value.trim()) {
      setter(prev => [...prev, value.trim()]);
      clearer("");
    }
  };

  const removeTag = (index: number, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleTemplateChange = (segment: string, field: 'subject' | 'body', value: string) => {
    setEmailTemplates(prev => {
      const current = prev[segment] || { subject: "", body: "" };
      return {
        ...prev,
        [segment]: {
          ...current,
          [field]: value
        }
      };
    });
  };

  const getTemplate = (segment: string) => {
    return emailTemplates[segment] || { subject: "", body: "" };
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white border-b p-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.push('/preset')}>
                <ChevronLeft className="w-5 h-5 text-gray-500" />
            </Button>
            <h1 className="text-xl font-bold text-gray-800">イベント管理</h1>
        </div>
        <Button onClick={handleOpenCreate} className="bg-primary text-white shadow-md">
          <Plus className="w-4 h-4 mr-2" /> 新規作成
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {loading ? (
          <div className="flex justify-center p-10">読み込み中...</div>
        ) : events.length === 0 ? (
          <div className="text-center p-10 text-gray-500 bg-white rounded-xl border border-dashed">
            イベントが登録されていません
          </div>
        ) : (
          <div className="space-y-4">
            {events.map(event => (
              <div key={event.id} className="bg-white p-5 rounded-xl border shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{event.name}</h3>
                    <div className="flex items-center text-sm text-gray-500 gap-2 mt-1">
                      <Calendar className="w-4 h-4" />
                      {event.event_date}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenEdit(event)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200" onClick={() => handleDelete(event.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2 mt-4 pt-4 border-t border-gray-100">
                  <div className="flex gap-2 items-start">
                    <Tag className="w-4 h-4 text-gray-400 mt-1 shrink-0" />
                    <div className="flex flex-wrap gap-1">
                      {event.attributes_preset?.slice(0, 5).map(a => (
                        <span key={a} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{a}</span>
                      ))}
                      {(event.attributes_preset?.length || 0) > 5 && <span className="text-xs text-gray-400">他...</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <h2 className="text-lg font-bold">{editingEvent ? "イベント編集" : "新規イベント作成"}</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}><X className="w-5 h-5" /></Button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 block">イベント名 <span className="text-red-500">*</span></label>
                <input 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none font-bold"
                  placeholder="例: 第10回 学術大会"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 block">開催日 <span className="text-red-500">*</span></label>
                <input 
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              {/* Attributes Section */}
              <div className="space-y-3 pt-2 border-t">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" /> 属性 (職種など)
                </label>
                <div className="flex gap-2">
                  <input 
                    value={newAttribute}
                    onChange={(e) => setNewAttribute(e.target.value)}
                    className="flex-1 p-2 border rounded text-sm"
                    placeholder="新しい属性を追加"
                    onKeyDown={(e) => e.key === 'Enter' && addTag(newAttribute, setAttributes, setNewAttribute)}
                  />
                  <Button size="sm" onClick={() => addTag(newAttribute, setAttributes, setNewAttribute)}><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg min-h-[60px]">
                  {attributes.map((tag, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-white border border-gray-200 px-2 py-1 rounded text-sm shadow-sm">
                      {tag}
                      <button onClick={() => removeTag(i, setAttributes)} className="text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                  {attributes.length === 0 && <span className="text-gray-400 text-xs">設定なし</span>}
                </div>
              </div>

              {/* Segments Section */}
              <div className="space-y-3 pt-2 border-t">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-green-600" /> 顧客区分
                </label>
                <div className="flex gap-2">
                  <input 
                    value={newSegment}
                    onChange={(e) => setNewSegment(e.target.value)}
                    className="flex-1 p-2 border rounded text-sm"
                    placeholder="新しい区分を追加"
                    onKeyDown={(e) => e.key === 'Enter' && addTag(newSegment, setSegments, setNewSegment)}
                  />
                  <Button size="sm" onClick={() => addTag(newSegment, setSegments, setNewSegment)}><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg min-h-[60px]">
                  {segments.map((tag, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-white border border-gray-200 px-2 py-1 rounded text-sm shadow-sm">
                      {tag}
                      <button onClick={() => removeTag(i, setSegments)} className="text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                  {segments.length === 0 && <span className="text-gray-400 text-xs">設定なし</span>}
                </div>
              </div>

              {/* Roles Section */}
              <div className="space-y-3 pt-2 border-t">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" /> 役割
                </label>
                <div className="flex gap-2">
                  <input 
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="flex-1 p-2 border rounded text-sm"
                    placeholder="新しい役割を追加"
                    onKeyDown={(e) => e.key === 'Enter' && addTag(newRole, setRoles, setNewRole)}
                  />
                  <Button size="sm" onClick={() => addTag(newRole, setRoles, setNewRole)}><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg min-h-[60px]">
                  {roles.map((tag, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-white border border-gray-200 px-2 py-1 rounded text-sm shadow-sm">
                      {tag}
                      <button onClick={() => removeTag(i, setRoles)} className="text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                  {roles.length === 0 && <span className="text-gray-400 text-xs">設定なし</span>}
                </div>
              </div>

              {/* Email Template Section */}
              <div className="space-y-3 pt-2 border-t">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-orange-600" /> 一斉送信テンプレート
                </label>
                
                <div className="flex gap-2 mb-2 overflow-x-auto pb-2 scrollbar-hide">
                  {segments.map(segment => (
                    <button
                      key={segment}
                      onClick={() => setSelectedTemplateSegment(segment)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
                        selectedTemplateSegment === segment
                          ? "bg-orange-600 text-white border-orange-600 shadow-md"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {segment}
                    </button>
                  ))}
                  {segments.length === 0 && (
                    <span className="text-xs text-red-500">先に「顧客区分」を設定してください</span>
                  )}
                </div>

                {selectedTemplateSegment && segments.includes(selectedTemplateSegment) && (
                    <div className="space-y-3 p-4 bg-orange-50/50 rounded-xl border border-orange-100 animate-in fade-in">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold bg-orange-600 text-white px-2 py-0.5 rounded">
                            {selectedTemplateSegment}
                        </span>
                        <span className="text-xs text-gray-500">用のテンプレート</span>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-gray-500 block mb-1">メール件名</span>
                        <input
                          value={getTemplate(selectedTemplateSegment).subject}
                          onChange={(e) => handleTemplateChange(selectedTemplateSegment, 'subject', e.target.value)}
                          className="w-full p-2 border border-gray-200 rounded text-sm"
                          placeholder={`【御礼】展示ブースにお立ち寄りいただきありがとうございます`}
                        />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-gray-500 block mb-1">メール本文</span>
                        <textarea
                          value={getTemplate(selectedTemplateSegment).body}
                          onChange={(e) => handleTemplateChange(selectedTemplateSegment, 'body', e.target.value)}
                          className="w-full p-2 border border-gray-200 rounded text-sm min-h-[150px]"
                          placeholder={`この度は、当社のブースにお立ち寄りいただき...\n\n(※ ${selectedTemplateSegment} 様向けのメッセージを入力)`}
                        />
                      </div>
                    </div>
                )}
              </div>

            </div>

            <div className="p-4 border-t bg-gray-50 rounded-b-2xl">
              <Button onClick={handleSave} className="w-full text-lg font-bold h-12 shadow-lg">
                <Save className="w-5 h-5 mr-2" />
                保存する
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
