'use client'

import { ChangeEvent } from 'react'
import clsx from 'clsx'

interface InputDateProps {
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  required?: boolean
}

function InputDate({ value, onChange, required = false }: InputDateProps) {
  return (
    <input
      id="birth"
      type="date"
      value={value}
      onChange={onChange}
      className={clsx([
        'w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-500',
        'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500',
        'transition-colors duration-200'
      ])}
      required={required}
    />
  )
}

export default InputDate
