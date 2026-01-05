'use client'

import { Menu, X } from 'lucide-react'
import { useState, createContext, useContext } from 'react'
import Sidebar from './Sidebar'

interface MobileSidebarContextType {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const MobileSidebarContext = createContext<MobileSidebarContextType>({
  isOpen: false,
  setIsOpen: () => { },
})

export function useMobileSidebar() {
  return useContext(MobileSidebarContext)
}

export function MobileSidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = () => {
    setIsClosing(true)
    // Wait for animation to complete before actually closing
    setTimeout(() => {
      setIsOpen(false)
      setIsClosing(false)
    }, 300)
  }

  return (
    <MobileSidebarContext.Provider value={{ isOpen, setIsOpen }}>
      {children}

      {/* Mobile Sidebar Overlay */}
      {(isOpen || isClosing) && (
        <>
          {/* Backdrop with fade animation */}
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={handleClose}
            style={{
              animation: isClosing ? 'fadeOut 200ms ease-out' : 'fadeIn 200ms ease-out'
            }}
          />

          {/* Sidebar with slide animation */}
          <div
            className="lg:hidden fixed inset-y-0 left-0 z-50 w-64"
            style={{
              animation: isClosing
                ? 'slideOutToLeft 300ms ease-out'
                : 'slideInFromLeft 300ms ease-out'
            }}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-lg bg-surface hover:bg-backplate flex items-center justify-center text-on-surface cursor-pointer transition-colors"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>

            <Sidebar onNavigate={handleClose} />
          </div>
        </>
      )}
    </MobileSidebarContext.Provider>
  )
}

export function MobileMenuButton() {
  const { setIsOpen } = useMobileSidebar()

  // Hidden on mobile since we have bottom nav - only shows on tablet (md to lg)
  return (
    <button
      onClick={() => setIsOpen(true)}
      className="hidden md:flex lg:hidden w-10 h-10 rounded-lg hover:bg-backplate items-center justify-center text-on-surface cursor-pointer transition-colors"
      aria-label="Open menu"
    >
      <Menu size={20} />
    </button>
  )
}

