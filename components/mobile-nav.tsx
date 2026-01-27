'use client'

import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { X, Home, Scan, Users, Settings, LogIn, UserPlus, ChevronRight } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const [mounted, setMounted] = useState(false)
  const { user } = useUser()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      {/* Overlay - click to close */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose}
      />
      
      {/* Container to align drawer with the main content area */}
      <div className="absolute inset-0 pointer-events-none flex justify-center">
        <div className="w-full max-w-md relative h-full flex justify-end">
          {/* Drawer Content */}
          <div 
            className="w-72 h-full bg-white text-gray-900 shadow-2xl flex flex-col pointer-events-auto border-l border-gray-100 transform transition-transform duration-300 ease-out"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <SignedIn>
                  <UserButton appearance={{ elements: { avatarBox: "w-9 h-9" } }} />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900">{user?.fullName || 'User'}</span>
                    <span className="text-xs text-gray-500">ログイン中</span>
                  </div>
                </SignedIn>
                <SignedOut>
                  <span className="text-lg font-bold text-gray-800">メニュー</span>
                </SignedOut>
              </div>
              <button 
                onClick={onClose} 
                aria-label="閉じる" 
                className="p-2 bg-white text-gray-500 border border-gray-200 rounded-full hover:bg-gray-100 transition-colors shadow-sm"
              >
                <X size={20} />
              </button>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
              <SignedIn>
                <p className="text-xs font-bold text-gray-400 mb-3 px-2">アプリケーション</p>
                <Link 
                  href="/dashboard" 
                  className="flex items-center justify-between p-4 rounded-xl bg-gray-900 text-white shadow-md hover:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
                  onClick={onClose}
                >
                  <div className="flex items-center gap-3">
                    <Home size={20} className="text-gray-300 group-hover:text-white transition-colors" />
                    <span className="font-bold">ダッシュボード</span>
                  </div>
                  <ChevronRight size={16} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </Link>
                
                <Link 
                  href="/scan" 
                  className="flex items-center justify-between p-4 rounded-xl bg-gray-900 text-white shadow-md hover:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group mt-3"
                  onClick={onClose}
                >
                  <div className="flex items-center gap-3">
                    <Scan size={20} className="text-gray-300 group-hover:text-white transition-colors" />
                    <span className="font-bold">名刺スキャン</span>
                  </div>
                  <ChevronRight size={16} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </Link>

                <Link 
                  href="/list" 
                  className="flex items-center justify-between p-4 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group mt-3"
                  onClick={onClose}
                >
                  <div className="flex items-center gap-3">
                    <Users size={20} className="text-gray-400 group-hover:text-gray-600" />
                    <span className="font-bold">来場者リスト</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                </Link>

                <Link 
                  href="/preset" 
                  className="flex items-center justify-between p-4 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group mt-3"
                  onClick={onClose}
                >
                  <div className="flex items-center gap-3">
                    <Settings size={20} className="text-gray-400 group-hover:text-gray-600" />
                    <span className="font-bold">イベント設定</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                </Link>

                <div className="pt-4 mt-2 border-t border-gray-100">
                    <p className="text-xs font-bold text-gray-400 mb-3 px-2">アカウント</p>
                    <Link 
                        href="/profile" 
                        className="flex items-center justify-between p-3 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-primary transition-all duration-200 group"
                        onClick={onClose}
                    >
                        <div className="flex items-center gap-3">
                            <Users size={18} className="text-gray-400 group-hover:text-primary transition-colors" />
                            <span className="font-medium text-sm">プロフィール設定</span>
                        </div>
                    </Link>
                </div>
              </SignedIn>
              
              <SignedOut>
                <div className="space-y-4 pt-4">
                  <SignInButton mode="modal">
                    <button className="flex items-center justify-center w-full p-4 rounded-xl bg-gray-900 text-white font-bold shadow-md hover:bg-gray-800 transition-all gap-2">
                      <LogIn size={20} />
                      ログイン
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="flex items-center justify-center w-full p-4 rounded-xl bg-primary text-white font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all gap-2">
                      <UserPlus size={20} />
                      新規登録
                    </button>
                  </SignUpButton>
                </div>
              </SignedOut>
            </nav>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400 font-medium">© 2026 CogEvo Event Connect</p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
