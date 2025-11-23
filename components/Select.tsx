'use client'

import { ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface SelectOption {
  value: string
  label: string
  description?: string
  icon?: string
}

interface SelectProps {
  name?: string
  id?: string
  options: SelectOption[]
  defaultValue?: string
  value?: string
  placeholder?: string
  className?: string
  required?: boolean
  disabled?: boolean
  onChange?: (value: string) => void
}

export default function Select({
  name,
  id,
  options,
  defaultValue,
  value: controlledValue,
  placeholder = 'Select an option',
  className = '',
  required = false,
  disabled = false,
  onChange,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [internalValue, setInternalValue] = useState(defaultValue || options[0]?.value || '')
  const containerRef = useRef<HTMLDivElement>(null)
  const hiddenInputRef = useRef<HTMLInputElement>(null)

  // Use controlled value if provided, otherwise use internal state
  const isControlled = controlledValue !== undefined
  const selectedValue = isControlled ? controlledValue : internalValue

  const selectedOption = options.find(opt => opt.value === selectedValue)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleSelect = (value: string) => {
    if (!isControlled) {
      setInternalValue(value)
    }
    setIsOpen(false)
    onChange?.(value)

    // Trigger form validation
    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = value
      hiddenInputRef.current.dispatchEvent(new Event('change', { bubbles: true }))
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Hidden input for form submission */}
      <input
        ref={hiddenInputRef}
        type="hidden"
        name={name}
        id={id}
        value={selectedValue}
        required={required}
      />

      {/* Custom Select Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-3 rounded-lg
          border border-border bg-surface-elevated
          text-left text-on-surface
          flex items-center justify-between gap-3
          transition-all duration-200
          hover:border-primary/50 hover:shadow-sm
          focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isOpen ? 'border-primary ring-2 ring-primary/30 shadow-sm' : ''}
        `}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {selectedOption?.icon && (
            <span className="text-lg shrink-0">{selectedOption.icon}</span>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">
              {selectedOption?.label || placeholder}
            </div>
            {selectedOption?.description && (
              <div className="text-xs text-on-surface-secondary truncate mt-0.5">
                {selectedOption.description}
              </div>
            )}
          </div>
        </div>
        <ChevronDown
          size={18}
          className={`text-neutral-medium transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''
            }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 rounded-lg border border-border bg-surface-elevated shadow-lg overflow-hidden animate-dropdown">
          <div className="max-h-64 overflow-y-auto py-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`
                  w-full px-4 py-3 text-left
                  flex items-center gap-3
                  transition-colors duration-150
                  hover:bg-primary/10
                  ${selectedValue === option.value
                    ? 'bg-primary/10 text-on-surface'
                    : 'text-on-surface'
                  }
                `}
              >
                {option.icon && (
                  <span className="text-lg shrink-0">{option.icon}</span>
                )}
                <div className="flex-1 min-w-0">
                  <div className={`font-medium text-sm truncate ${selectedValue === option.value ? 'text-primary' : ''
                    }`}>
                    {option.label}
                  </div>
                  {option.description && (
                    <div className="text-xs text-on-surface-secondary truncate mt-0.5">
                      {option.description}
                    </div>
                  )}
                </div>
                {selectedValue === option.value && (
                  <svg
                    className="w-4 h-4 text-primary shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

