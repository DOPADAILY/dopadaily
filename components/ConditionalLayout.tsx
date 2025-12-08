'use client'

import { usePathname } from 'next/navigation'
import AnimatedBackground from './AnimatedBackground'

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Don't add margin on auth pages
  const authPages = ['/login', '/signup', '/forgot-password', '/reset-password', '/banned']
  const isAuthPage = authPages.some(page => pathname.startsWith(page))

  // Check if on focus page for special background variant
  const isFocusPage = pathname === '/focus'

  if (isAuthPage) {
    return <main className="min-h-screen">{children}</main>
  }

  // On mobile: no margin, On desktop: margin for sidebar
  return (
    <main className="min-h-screen lg:ml-64 relative">
      <AnimatedBackground variant={isFocusPage ? 'focus' : 'default'} />
      <div className="relative">
        {children}
      </div>
    </main>
  )
}

