"use client"

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { 
  X, 
  Home, 
  Settings, 
  LogOut, 
  User, 
  List, 
  Gift, 
  BarChart3,
  QrCode
} from 'lucide-react'
import { useClerk } from '@clerk/nextjs'
import { cn } from '@/lib/utils'

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { signOut } = useClerk()
  
  // マウント状態（DOMに存在するかどうか）
  const [mounted, setMounted] = useState(false)
  // アニメーション用状態（クラスの切り替え用）
  const [active, setActive] = useState(false)

  // isOpenがtrueになったらマウントし、次のフレームでアクティブにする
  useEffect(() => {
    if (isOpen) {
      setMounted(true)
      // マウント直後にアニメーションを開始するために少し遅延させる
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setActive(true)
        })
      })
      document.body.style.overflow = 'hidden' // スクロール防止
    } else {
      setActive(false)
      // アニメーション終了後にアンマウント
      const timer = setTimeout(() => {
        setMounted(false)
        document.body.style.overflow = ''
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // パス変更時にメニューを閉じる（isOpenやonCloseの変更では発火させない）
  const prevPathname = useRef(pathname)
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      if (isOpen) {
        onClose()
      }
      prevPathname.current = pathname
    }
  }, [pathname, isOpen, onClose])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
    onClose()
  }

  if (!mounted && !isOpen) return null

  const navItems = [
    { href: '/dashboard', label: 'ダッシュボード', icon: BarChart3 },
    { href: '/scan', label: 'スキャン画面', icon: QrCode },
    { href: '/list', label: '来場者リスト', icon: List },
    { href: '/gift', label: 'ギフト管理', icon: Gift },
    { href: '/preset', label: 'イベント選択', icon: Settings },
    { href: '/profile', label: 'プロフィール設定', icon: User },
  ]

  return (
    <div className="fixed inset-0 z-[100]">
      {/* オーバーレイ */}
      <div 
        className={cn(
          "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
          active ? "opacity-100" : "opacity-0",
          // アクティブでないときはクリックを受け付けない（ゴーストクリック防止）
          !active && "pointer-events-none"
        )}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (active) onClose()
        }}
      />

      {/* メニュー本体 */}
      <div 
        className={cn(
          "absolute right-0 top-0 h-[100dvh] w-3/4 max-w-sm bg-white shadow-2xl transition-transform duration-300 ease-out flex flex-col",
          active ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="p-4 pt-safe border-b flex justify-between items-center bg-primary/5">
          <h2 className="font-bold text-lg text-primary">メニュー</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-black/5 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 min-h-0">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link 
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium",
                    pathname === item.href 
                      ? "bg-primary/10 text-primary" 
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <item.icon size={20} className="shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 pb-safe border-t bg-gray-50">
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
          >
            <LogOut size={20} />
            ログアウト
          </button>
        </div>
      </div>
    </div>
  )
}
