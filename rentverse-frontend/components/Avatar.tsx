'use client'

import React from 'react'
import clsx from 'clsx'

interface AvatarProps {
  user: {
    firstName: string
    lastName: string
    email: string
  }
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
}

function Avatar({ user, size = 'md', className, onClick }: AvatarProps): React.ReactNode {
  // Generate initials from first and last name
  const getInitials = (firstName: string, lastName: string): string => {
    const firstInitial = firstName?.charAt(0)?.toUpperCase() || ''
    const lastInitial = lastName?.charAt(0)?.toUpperCase() || ''
    
    // If we have both, use both. If only one, use that one. If none, use email first letter
    if (firstInitial && lastInitial) {
      return firstInitial + lastInitial
    } else if (firstInitial) {
      return firstInitial
    } else if (lastInitial) {
      return lastInitial
    } else {
      return user.email?.charAt(0)?.toUpperCase() || 'U'
    }
  }

  // Size variants
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base', 
    lg: 'w-12 h-12 text-lg'
  }

  const initials = getInitials(user.firstName, user.lastName)

  return (
    <button
      className={clsx([
        'rounded-full bg-teal-600 text-white font-semibold',
        'flex items-center justify-center cursor-pointer',
        'hover:bg-teal-700 transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2',
        'select-none border-0',
        sizeClasses[size],
        className
      ])}
      onClick={onClick}
      title={`${user.firstName} ${user.lastName}`}
      type="button"
    >
      {initials}
    </button>
  )
}

export default Avatar