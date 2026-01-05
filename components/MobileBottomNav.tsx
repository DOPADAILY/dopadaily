'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Brain, LayoutGrid, MessageCircle, MoreHorizontal } from 'lucide-react'
import { useUnreadMessageCount } from '@/hooks/queries'
import { useState } from 'react'
import MoreMenu from './MoreMenu'

export default function MobileBottomNav() {
  const pathname = usePathname()
  const { data: unreadCount = 0 } = useUnreadMessageCount()
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === '/dashboard'
    return pathname?.startsWith(path)
  }

  // Primary navigation items (shown in pill)
  const navItems = [
    { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/focus', label: 'Focus', icon: Brain },
    { href: '/tasks', label: 'Tasks', icon: LayoutGrid },
    { 
      href: '/messages', 
      label: 'Messages', 
      icon: MessageCircle, 
      badge: unreadCount > 0 ? unreadCount : undefined 
    },
  ]

  return (
    <>
      {/* Floating Pill Navigation - Compact */}
      <nav 
        className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-slide-up"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="bg-neutral-darkest/95 backdrop-blur-xl border border-neutral-dark/50 rounded-full shadow-mobile-nav px-2 py-2 flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            const hasBadge = item.badge && item.badge > 0

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all duration-200 ${
                  active
                    ? 'bg-primary text-on-primary shadow-md'
                    : 'text-surface hover:bg-neutral-dark/30 active:scale-95'
                }`}
                aria-label={item.label}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                
                {/* Badge for unread messages */}
                {hasBadge && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                    {item.badge! > 9 ? '9+' : item.badge}
                  </span>
                )}
              </Link>
            )
          })}

          {/* More Button */}
          <button
            onClick={() => setIsMoreMenuOpen(true)}
            className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all duration-200 ${
              isMoreMenuOpen
                ? 'bg-primary text-on-primary shadow-md'
                : 'text-surface hover:bg-neutral-dark/30 active:scale-95'
            }`}
            aria-label="More"
          >
            <MoreHorizontal size={20} strokeWidth={2} />
          </button>
        </div>
      </nav>

      {/* More Menu Bottom Sheet */}
      <MoreMenu 
        isOpen={isMoreMenuOpen} 
        onClose={() => setIsMoreMenuOpen(false)} 
      />
    </>
  )
}

