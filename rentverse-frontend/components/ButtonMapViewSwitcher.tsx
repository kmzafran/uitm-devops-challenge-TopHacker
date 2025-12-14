'use client'

import React from 'react'
import { Map, LayoutList } from 'lucide-react'
import ButtonFilledSlate from '@/components/ButtonFilledSlate'

interface ButtonMapviewSwitcher extends React.HTMLAttributes<HTMLSpanElement> {
  onClick: () => void
  isMapView: boolean
}

function ButtonMapViewSwitcher({ onClick, isMapView, className }: ButtonMapviewSwitcher) {
  // Extract only the props that are safe to pass to Lucide icons
  const iconProps = {
    size: 20,
  }

  return isMapView ? (
    <ButtonFilledSlate
      onClick={onClick}
      label={'List View'}
      className={className}
      iconRight={<LayoutList {...iconProps} />}
    />
  ) : (
    <ButtonFilledSlate
      onClick={onClick}
      label={'Map View'}
      className={className}
      iconRight={<Map {...iconProps} />}
    />
  )
}

export default ButtonMapViewSwitcher
