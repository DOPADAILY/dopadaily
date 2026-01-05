'use client'

import { useEffect, useState, ReactNode } from 'react'
import { X } from 'lucide-react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  maxHeight?: string
  showCloseButton?: boolean
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  maxHeight = '80vh',
  showCloseButton = true,
}: BottomSheetProps) {
  const [isClosing, setIsClosing] = useState(false)

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 250)
  }

  if (!isOpen && !isClosing) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-250 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleClose}
      />

      {/* Bottom Sheet */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 bg-surface-elevated rounded-t-3xl shadow-mobile-elevated transition-transform duration-250 ${
          isClosing ? 'translate-y-full' : 'translate-y-0'
        }`}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 24px)',
          maxHeight,
        }}
      >
        {/* Handle Bar */}
        <div className="pt-3 pb-2 flex justify-center">
          <div className="w-12 h-1 bg-neutral-light rounded-full" />
        </div>

        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            {title && <h2 className="text-lg font-bold text-on-surface">{title}</h2>}
            {showCloseButton && (
              <button
                onClick={handleClose}
                className="ml-auto w-8 h-8 rounded-full bg-backplate hover:bg-border flex items-center justify-center text-on-surface transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto px-6 py-4" style={{ maxHeight: `calc(${maxHeight} - 120px)` }}>
          {children}
        </div>
      </div>
    </>
  )
}

