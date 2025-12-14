'use client'

import { ChangeEvent, useState } from 'react'
import clsx from 'clsx'

interface InputPasswordProps {
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  required?: boolean
  showStrengthIndicator?: boolean
}

function InputPassword({
  value,
  onChange,
  placeholder = "Password",
  required = false,
  showStrengthIndicator = true
}: InputPasswordProps) {
  const [showPassword, setShowPassword] = useState(false)

  const getPasswordStrength = (password: string) => {
    if (password.length < 6) return 'Weak'
    if (password.length < 10) return 'Fair'
    if (password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password)) return 'Strong'
    return 'Good'
  }

  const passwordStrength = getPasswordStrength(value)

  return (
    <div>
      <div className="relative">
        <input
          id="password"
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={clsx([
            'w-full px-4 py-3 pr-16 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-500',
            'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500',
            'transition-colors duration-200'
          ])}
          required={required}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 text-sm"
        >
          Show
        </button>
      </div>

      {/* Password Strength Indicator */}
      {showStrengthIndicator && value && (
        <div className="mt-3">
          <div className="flex space-x-1 mb-1">
            {[1, 2, 3, 4].map((level) => {
              let bgColor = 'bg-slate-200'

              if (passwordStrength === 'Weak' && level === 1) {
                bgColor = 'bg-red-400'
              } else if (passwordStrength === 'Fair' && level <= 2) {
                bgColor = 'bg-orange-400'
              } else if (passwordStrength === 'Good' && level <= 3) {
                bgColor = 'bg-yellow-400'
              } else if (passwordStrength === 'Strong') {
                bgColor = 'bg-green-400'
              }

              return (
                <div
                  key={level}
                  className={`h-1 flex-1 rounded-full ${bgColor}`}
                />
              )
            })}
          </div>
          <p className="text-xs text-slate-500 text-center">
            Password strength: {passwordStrength}
          </p>
        </div>
      )}
    </div>
  )
}

export default InputPassword
