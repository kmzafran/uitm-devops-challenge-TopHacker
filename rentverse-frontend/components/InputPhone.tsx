'use client'

import clsx from 'clsx'
import React, { ChangeEvent, forwardRef } from 'react'

interface InputPhoneProps {
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  required?: boolean
  className?: string
  disabled?: boolean
}

const InputPhone = forwardRef<HTMLInputElement, InputPhoneProps>(
  ({ value, onChange, placeholder = "Phone number", required = false, className, disabled = false }, ref) => {
    return (
      <div className="relative">
        <input
          ref={ref}
          type="tel"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={clsx([
            'w-full px-4 py-3 border border-slate-300 rounded-xl',
            'focus:ring-2 focus:ring-teal-500 focus:border-transparent',
            'text-slate-900 placeholder-slate-500',
            'transition-all duration-200',
            'disabled:bg-slate-100 disabled:cursor-not-allowed',
            className
          ])}
        />
      </div>
    )
  }
)

InputPhone.displayName = 'InputPhone'

export default InputPhone