'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Brain, MessageSquare, Bell, LogOut, LayoutDashboard, ShieldCheck, Award, Headphones, FileText, Crown, Settings, MessageCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { isSessionError, handleSessionError } from '@/utils/errorHandling'
import { useUnreadMessageCount } from '@/hooks/queries'

interface SidebarProps {
  onNavigate?: () => void
}

export default function Sidebar({ onNavigate }: SidebarProps = {}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const { data: unreadCount = 0 } = useUnreadMessageCount()

  useEffect(() => {
    const checkUserStatus = async () => {
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      // Handle session errors - clear session and redirect to login
      if (userError && isSessionError(userError)) {
        await handleSessionError(supabase)
        return
      }

      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, subscription_status, subscription_plan')
          .eq('id', user.id)
          .single()

        // Handle 406 or other session errors from profile fetch
        if (profileError && isSessionError(profileError)) {
          await handleSessionError(supabase)
          return
        }

        setIsAdmin(profile?.role === 'admin' || profile?.role === 'super_admin')
        // Check for both 'active' and 'trialing' statuses (per stripe-config.ts)
        const status = profile?.subscription_status
        setIsPremium(profile?.subscription_plan === 'premium' && (status === 'active' || status === 'trialing'))
      }
    }
    checkUserStatus()
  }, [])

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/'
    return pathname?.startsWith(path)
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    onNavigate?.()
    window.location.href = '/login'
  }

  const handleNavClick = () => {
    onNavigate?.()
  }

  // Base nav items (visible to all users)
  const baseNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/focus', label: 'Focus Timer', icon: Brain },
    { href: '/notes', label: 'Notes', icon: FileText },
    { href: '/sounds', label: 'Dopaflow Sound Library', icon: Headphones },
    { href: '/achievements', label: 'Achievements', icon: Award },
    { href: '/messages', label: 'Messages', icon: MessageCircle, badge: unreadCount },
    { href: '/forum', label: 'Community', icon: MessageSquare },
    { href: '/reminders', label: 'Reminders', icon: Bell },
  ]

  // Add Upgrade link only for free users (not admin or premium)
  const showUpgrade = !isAdmin && !isPremium
  const navItems = showUpgrade
    ? [...baseNavItems, { href: '/pricing', label: 'Upgrade', icon: Crown, highlight: true }]
    : baseNavItems

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-surface-elevated/95 backdrop-blur-sm border-r border-border flex flex-col z-40">

      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-border">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
          <Brain size={20} className="text-on-primary" />
        </div>
        <span className="text-lg font-bold text-on-surface">
          Dopadaily
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map((item, index) => {
          const Icon = item.icon
          const isHighlight = 'highlight' in item && item.highlight
          const hasBadge = 'badge' in item && item.badge && item.badge > 0
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavClick}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer animate-slide-in-left ${active
                ? 'bg-primary text-on-primary shadow-sm'
                : isHighlight
                  ? 'text-primary bg-primary/10 hover:bg-primary/20'
                  : 'text-on-surface-secondary hover:bg-backplate hover:text-on-surface'
                }`}
              style={{ animationDelay: `${index * 0.12}s` }}
            >
              {/* Active indicator line */}
              <span
                className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-primary transition-all duration-200 ${active ? 'h-[60%] opacity-100' : 'h-0 opacity-0 group-hover:h-[40%] group-hover:opacity-50'
                  }`}
              />
              <Icon size={20} className={`transition-transform duration-200 ${!active ? 'group-hover:scale-110' : ''}`} />
              <span className="flex-1">{item.label}</span>
              {/* Unread badge */}
              {hasBadge && (
                <span className="shrink-0 min-w-[20px] h-5 px-1.5 bg-error text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {item.badge! > 9 ? '9+' : item.badge}
                </span>
              )}
              {/* Hover glow effect */}
              {!active && (
                <span className="absolute inset-0 rounded-lg bg-primary/0 group-hover:bg-primary/5 transition-colors duration-200" />
              )}
            </Link>
          )
        })}

        {/* Admin Link - Only shown to admins */}
        {isAdmin && (
          <>
            <div className="border-t border-border my-3"></div>
            <Link
              href="/admin"
              onClick={handleNavClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${isActive('/admin')
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-secondary hover:bg-backplate hover:text-on-surface'
                }`}
            >
              <ShieldCheck size={20} />
              Admin Panel
            </Link>
          </>
        )}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-border space-y-1">
        <Link
          href="/settings"
          onClick={handleNavClick}
          className={`group relative flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${isActive('/settings')
            ? 'bg-primary text-on-primary shadow-sm'
            : 'text-on-surface-secondary hover:bg-backplate hover:text-on-surface'
            }`}
        >
          <Settings size={20} className={`transition-transform duration-300 ${!isActive('/settings') ? 'group-hover:rotate-90' : ''}`} />
          Settings
        </Link>
        <button
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-on-surface-secondary hover:bg-error/10 hover:text-error transition-all duration-200 cursor-pointer"
        >
          <LogOut size={20} className="transition-transform duration-200 group-hover:translate-x-1" />
          Logout
        </button>
      </div>
    </aside>
  )
}
