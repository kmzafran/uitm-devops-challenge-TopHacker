'use client'

import { ReactNode } from 'react'
import clsx from 'clsx'

interface ButtonFilledProps {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  className?: string
}

function ButtonFilled({
                        children,
                        onClick,
                        type = 'button',
                        disabled = false,
                        className = '',
                      }: ButtonFilledProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx([
        'w-full bg-teal-600 text-white font-medium py-3 px-4 rounded-full cursor-pointer',
        'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2',
        'hover:bg-teal-700 disabled:bg-slate-400 disabled:cursor-not-allowed',
        'transition-colors duration-200',
        className,
      ])}
    >
      {children}
    </button>
  )
}

export default ButtonFilled
