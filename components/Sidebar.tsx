'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Brain, MessageSquare, Bell, LogOut, LayoutDashboard, ShieldCheck, Award, Headphones, FileText } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { isSessionError, handleSessionError } from '@/utils/errorHandling'

interface SidebarProps {
  onNavigate?: () => void
}

export default function Sidebar({ onNavigate }: SidebarProps = {}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
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
          .select('role')
          .eq('id', user.id)
          .single()

        // Handle 406 or other session errors from profile fetch
        if (profileError && isSessionError(profileError)) {
          await handleSessionError(supabase)
          return
        }

        setIsAdmin(profile?.role === 'admin')
      }
    }
    checkAdmin()
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

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/focus', label: 'Focus Timer', icon: Brain },
    { href: '/notes', label: 'Notes', icon: FileText },
    { href: '/sounds', label: 'Ambient Sounds', icon: Headphones },
    { href: '/achievements', label: 'Achievements', icon: Award },
    { href: '/forum', label: 'Community', icon: MessageSquare },
    { href: '/reminders', label: 'Reminders', icon: Bell },
  ]

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-surface-elevated border-r border-border flex flex-col">

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
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${isActive(item.href)
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-secondary hover:bg-backplate hover:text-on-surface'
                }`}
            >
              <Icon size={20} />
              {item.label}
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
      <div className="p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-on-surface-secondary hover:bg-backplate hover:text-on-surface transition-all cursor-pointer"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  )
}
