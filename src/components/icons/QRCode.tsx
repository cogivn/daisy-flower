import React from 'react'

export const QRCodeIcon: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="miter"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="5" y="5" width="3" height="3" fill="currentColor" stroke="none" />
      <rect x="16" y="5" width="3" height="3" fill="currentColor" stroke="none" />
      <rect x="5" y="16" width="3" height="3" fill="currentColor" stroke="none" />

      <rect x="12" y="12" width="2" height="2" fill="currentColor" stroke="none" />
      <rect x="16" y="12" width="1" height="1" fill="currentColor" stroke="none" />
      <rect x="18" y="13" width="2" height="2" fill="currentColor" stroke="none" />
      <rect x="12" y="16" width="1" height="1" fill="currentColor" stroke="none" />
      <rect x="14" y="17" width="2" height="2" fill="currentColor" stroke="none" />
      <rect x="17" y="17" width="1" height="1" fill="currentColor" stroke="none" />
      <rect x="19" y="16" width="1" height="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

