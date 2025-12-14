import React from 'react'
import clsx from 'clsx'

interface ButtonSecondaryProps {
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
  label?: string
  onClick?: () => void
  disabled?: boolean
  className?: string
}

function ButtonSecondary({
  iconLeft,
  iconRight,
  label,
  onClick,
  disabled = false,
  className = ''
}: ButtonSecondaryProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx([
        'inline-flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 font-medium rounded-full text-sm',
        'cursor-pointer shadow hover:shadow-md',
        'border border-slate-300 hover:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-500',
        'disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200',
        className
      ])}
    >
      {iconLeft && <span className="flex items-center">{iconLeft}</span>}
      {label && <span>{label}</span>}
      {iconRight && <span className="flex items-center">{iconRight}</span>}
    </button>
  )
}

export default ButtonSecondary
