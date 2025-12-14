import clsx from 'clsx'
import React from 'react'

interface ButtonCircleProps {
  icon: React.ReactNode
  onClick?: () => void
}

function ButtonCircle(props: ButtonCircleProps) {
  return (
    <button
      className={clsx([
        'flex items-center space-x-2 text-slate-700 p-2 rounded-lg',
        'hover:text-slate-900 hover:bg-slate-50 transition-colors duration-200',
      ])}
      onClick={props.onClick}
    >
      {props.icon}
    </button>
  )
}

export default ButtonCircle
