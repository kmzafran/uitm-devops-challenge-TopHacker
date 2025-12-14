import React from 'react'
import clsx from 'clsx'

interface ButtonFilledStateProps {
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
  label?: string
  onClick?: () => void
  disabled?: boolean
  className?: string
}

function ButtonFilledState({
                             iconLeft,
                             iconRight,
                             label,
                             onClick,
                             disabled = false,
                             className = '',
                           }: ButtonFilledStateProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx([
        'inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-50 font-medium rounded-full text-sm',
        'cursor-pointer shadow hover:shadow-md',
        'disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200',
        className,
      ])}
    >
      {iconLeft && <span className="flex items-center">{iconLeft}</span>}
      {label && <span>{label}</span>}
      {iconRight && <span className="flex items-center">{iconRight}</span>}
    </button>
  )
}

export default ButtonFilledState
