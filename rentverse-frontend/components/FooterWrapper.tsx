import React from 'react'

function FooterWrapper({ children }: { children: React.ReactNode }) {
  return <div className="mb-16 md:mb-0">{children}</div>
}

export default FooterWrapper
