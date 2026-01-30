'use client'

import { 
  SignInButton, 
  SignUpButton, 
  SignedIn, 
  SignedOut, 
  UserButton 
} from '@clerk/nextjs'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { useState } from 'react'
import { MobileNav } from './mobile-nav'
import { useTranslation } from '@/lib/i18n/context'

export function Header() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const { language, setLanguage } = useTranslation()

  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex items-center justify-between px-4 py-3">
        {/* ロゴ */}
        <Link href="/" className="text-xl font-bold text-primary">
          Event Connect
        </Link>

        {/* 認証ボタン & モバイルメニュー */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setLanguage(language === 'ja' ? 'en' : 'ja')}
            className="text-xs font-bold px-2 py-1 rounded border border-gray-200 text-gray-500 hover:text-primary hover:border-primary transition-colors mr-1"
          >
            {language === 'ja' ? 'EN' : '日本語'}
          </button>

          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
                ログイン
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="px-3 py-1.5 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                登録
              </button>
            </SignUpButton>
          </SignedOut>
          
          <SignedIn>
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 rounded-full"
                }
              }}
            />
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsMobileNavOpen(true)
              }}
              className="p-2 ml-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="メニュー"
            >
              <Menu size={24} />
            </button>
          </SignedIn>
        </div>
      </div>
      <MobileNav isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />
    </header>
  )
}
