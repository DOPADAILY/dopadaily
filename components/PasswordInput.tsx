'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordInputProps {
    id: string
    name: string
    placeholder?: string
    required?: boolean
    disabled?: boolean
    minLength?: number
    className?: string
    value?: string
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function PasswordInput({
    id,
    name,
    placeholder = 'Enter your password',
    required = false,
    disabled = false,
    minLength,
    className = '',
    value,
    onChange
}: PasswordInputProps) {
    const [showPassword, setShowPassword] = useState(false)

    return (
        <div className={`relative w-full rounded-[8px] border border-border bg-surface-elevated focus-within:border-primary transition-colors ${className}`}>
            <div className="box-border flex w-full items-center gap-[8px] overflow-clip rounded-[inherit] px-[14px] py-[10px]">
                <input
                    id={id}
                    name={name}
                    type={showPassword ? 'text' : 'password'}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    minLength={minLength}
                    value={value}
                    onChange={onChange}
                    className="min-w-0 flex-1 bg-transparent text-[14px] font-normal leading-[20px] text-on-surface outline-none placeholder:text-neutral-medium disabled:opacity-50"
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={disabled}
                    className="shrink-0 p-1 rounded hover:bg-backplate transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                    {showPassword ? (
                        <EyeOff size={18} className="text-neutral-medium" />
                    ) : (
                        <Eye size={18} className="text-neutral-medium" />
                    )}
                </button>
            </div>
        </div>
    )
}

