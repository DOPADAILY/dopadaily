'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  FileText,
  Headphones,
  Award,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  Crown,
  ShieldCheck,
  X,
  ChevronRight,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { isSessionError, handleSessionError } from '@/utils/errorHandling'

interface MoreMenuProps {
  isOpen: boolean
  onClose: () => void
}

export default function MoreMenu({ isOpen, onClose }: MoreMenuProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    const checkUserStatus = async () => {
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()

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

        if (profileError && isSessionError(profileError)) {
          await handleSessionError(supabase)
          return
        }

        setIsAdmin(profile?.role === 'admin' || profile?.role === 'super_admin')
        const status = profile?.subscription_status
        setIsPremium(profile?.subscription_plan === 'premium' && (status === 'active' || status === 'trialing'))
      }
    }
    if (isOpen) {
      checkUserStatus()
    }
  }, [isOpen])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 250)
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    handleClose()
    window.location.href = '/login'
  }

  const handleNavClick = () => {
    handleClose()
  }

  const isActive = (path: string) => {
    return pathname?.startsWith(path)
  }

  // Secondary navigation items
  const menuItems = [
    { href: '/notes', label: 'Notes', icon: FileText, group: 'Features' },
    { href: '/sounds', label: 'Sound Library', icon: Headphones, group: 'Features' },
    { href: '/achievements', label: 'Achievements', icon: Award, group: 'Features' },
    { href: '/forum', label: 'Community', icon: MessageSquare, group: 'Features' },
    { href: '/reminders', label: 'Reminders', icon: Bell, group: 'Features' },
  ]

  // Group items by category
  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = []
    acc[item.group].push(item)
    return acc
  }, {} as Record<string, typeof menuItems>)

  if (!isOpen && !isClosing) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={`lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-250 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleClose}
      />

      {/* Bottom Sheet */}
      <div
        className={`lg:hidden fixed inset-x-0 bottom-0 z-50 bg-surface-elevated rounded-t-3xl shadow-mobile-elevated transition-transform duration-250 ${
          isClosing ? 'translate-y-full' : 'translate-y-0'
        }`}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 24px)',
          maxHeight: '80vh',
        }}
      >
        {/* Handle Bar */}
        <div className="pt-3 pb-2 flex justify-center">
          <div className="w-12 h-1 bg-neutral-light rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold text-on-surface">More</h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-backplate hover:bg-border flex items-center justify-center text-on-surface transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(80vh - 120px)' }}>
          {/* Menu Items by Group */}
          {Object.entries(groupedItems).map(([group, items]) => (
            <div key={group} className="mb-6">
              <h3 className="text-xs font-semibold text-on-surface-secondary uppercase tracking-wide mb-3">
                {group}
              </h3>
              <div className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleNavClick}
                      className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                        active
                          ? 'bg-primary text-on-primary shadow-sm'
                          : 'text-on-surface hover:bg-backplate active:scale-98'
                      }`}
                    >
                      <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                      <span className="flex-1 font-medium">{item.label}</span>
                      <ChevronRight size={18} className="opacity-40" />
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Upgrade Section (if free user) */}
          {!isAdmin && !isPremium && (
            <div className="mb-6">
              <Link
                href="/pricing"
                onClick={handleNavClick}
                className="flex items-center gap-4 px-4 py-4 rounded-2xl bg-primary/10 border-2 border-primary text-primary hover:bg-primary/20 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <Crown size={20} className="text-on-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-bold">Upgrade to Premium</div>
                  <div className="text-xs opacity-80">Unlock all features</div>
                </div>
                <ChevronRight size={18} />
              </Link>
            </div>
          )}

          {/* Admin Section (if admin) */}
          {isAdmin && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-on-surface-secondary uppercase tracking-wide mb-3">
                Admin
              </h3>
              <Link
                href="/admin"
                onClick={handleNavClick}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                  isActive('/admin')
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface hover:bg-backplate'
                }`}
              >
                <ShieldCheck size={22} strokeWidth={isActive('/admin') ? 2.5 : 2} />
                <span className="flex-1 font-medium">Admin Panel</span>
                <ChevronRight size={18} className="opacity-40" />
              </Link>
            </div>
          )}

          {/* Settings & Logout */}
          <div className="mb-4 pt-4 border-t border-border">
            <div className="space-y-1">
              <Link
                href="/settings"
                onClick={handleNavClick}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                  isActive('/settings')
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface hover:bg-backplate'
                }`}
              >
                <Settings size={22} strokeWidth={isActive('/settings') ? 2.5 : 2} />
                <span className="flex-1 font-medium">Settings</span>
                <ChevronRight size={18} className="opacity-40" />
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-4 px-4 py-3.5 rounded-2xl text-error hover:bg-error/10 transition-all duration-200"
              >
                <LogOut size={22} />
                <span className="flex-1 font-medium text-left">Logout</span>
                <ChevronRight size={18} className="opacity-40" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

