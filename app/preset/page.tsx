"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/app/providers";

export default function PresetPage() {
  const router = useRouter();
  const { 
    eventName, setEventName, 
    attributes, addAttribute, removeAttribute,
    segments, addSegment, removeSegment,
    roles, addRole, removeRole
  } = useSettings();
  
  const [newAttribute, setNewAttribute] = useState("");
  const [newSegment, setNewSegment] = useState("");
  const [newRole, setNewRole] = useState("");
  
  const handleStart = () => {
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
        {/* Event Name */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">イベント名</label>
          <input
            type="text"
            className="w-full p-4 border border-gray-300 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="イベント名を入力"
          />
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
        <Button size="lg" className="w-full text-lg shadow-lg" onClick={handleStart}>
          設定を完了して開始
        </Button>
      </div>
    </div>
  );
}
