'use client'

import { ChangeEvent } from 'react'
import clsx from 'clsx'

interface InputEmailProps {
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  required?: boolean
}

function InputEmail({ value, onChange, placeholder = "Email", required = false }: InputEmailProps) {
  return (
    <div>
      <input
        type="email"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={clsx([
          'w-full px-4 py-3 rounded-xl',
          'border border-slate-300 text-slate-900 placeholder-slate-500',
          'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500',
          'transition-colors duration-200'
        ])}
        required={required}
      />
    </div>
  )
}

export default InputEmail
