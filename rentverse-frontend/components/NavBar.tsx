import React from 'react'
import NavBarTop from '@/components/NavBarTop'
import NavBarBottom from '@/components/NavBarBottom'

import type { SearchBoxType } from '@/types/searchbox'

interface NavBarProps {
  searchBoxType?: SearchBoxType
}

function NavBar({ searchBoxType = 'none' }: Readonly<NavBarProps>): React.ReactNode {
  return (
    <div className="w-full fixed z-50">
      <NavBarTop searchBoxType={searchBoxType} />
      <NavBarBottom />
    </div>
  )
}

export default NavBar