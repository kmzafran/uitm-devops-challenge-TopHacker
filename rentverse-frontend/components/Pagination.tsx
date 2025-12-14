'use client'

import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps): React.ReactElement {
  const getVisiblePages = () => {
    const pages: (number | string)[] = []

    if (totalPages <= 7) {
      // Show all pages if total is 7 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      if (currentPage <= 4) {
        // Show first 5 pages, then ellipsis, then last page
        for (let i = 2; i <= 5; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 3) {
        // Show first page, ellipsis, then last 5 pages
        pages.push('...')
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // Show first page, ellipsis, current page area, ellipsis, last page
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  const visiblePages = getVisiblePages()

  return (
    <div className="flex items-center justify-center gap-2">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={clsx(
          'flex items-center justify-center w-10 h-10 rounded-full transition-colors',
          currentPage === 1
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100',
        )}
      >
        <ChevronLeft size={20} />
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-2">
        {visiblePages.map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="flex items-center justify-center w-10 h-10 text-gray-500">
                ...
              </span>
            ) : (
              <button
                onClick={() => onPageChange(page as number)}
                className={clsx(
                  'flex items-center justify-center w-10 h-10 rounded-full font-medium transition-colors',
                  currentPage === page
                    ? 'bg-slate-800 text-white'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100',
                )}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={clsx(
          'flex items-center justify-center w-10 h-10 rounded-full transition-colors',
          currentPage === totalPages
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100',
        )}
      >
        <ChevronRight size={20} />
      </button>
    </div>
  )
}

export default Pagination