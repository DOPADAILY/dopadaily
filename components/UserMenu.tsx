'use client'

import UserAvatar from './UserAvatar'
import { LogOut, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

interface UserMenuProps {
  email?: string
  username?: string
}

export default function UserMenu({ email, username }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setIsOpen(false)
    window.location.href = '/login'
  }

  const displayName = username || email?.split('@')[0] || 'User'

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-backplate transition-colors cursor-pointer"
      >
        <UserAvatar email={email} username={username} size="sm" />
        <div className="text-left hidden lg:block">
          <p className="text-sm font-medium text-on-surface">{displayName}</p>
          {email && <p className="text-xs text-on-surface-secondary">{email}</p>}
        </div>
        <ChevronDown size={16} className={`text-on-surface-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-56 bg-surface-elevated border border-border rounded-lg shadow-lg z-20">
            <div className="p-3 border-b border-border">
              <p className="text-sm font-medium text-on-surface">{displayName}</p>
              {email && <p className="text-xs text-on-surface-secondary">{email}</p>}
            </div>
            <div className="p-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-on-surface-secondary hover:bg-backplate hover:text-on-surface rounded-lg transition-colors cursor-pointer"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

