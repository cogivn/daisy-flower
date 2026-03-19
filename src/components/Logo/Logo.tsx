'use client'

import React from 'react'

export const Logo: React.FC = () => {
  return (
    <div className="flex items-center gap-3">
      {/* HUYNH YEN abstract flower/H icon */}
      <div className="relative w-6 h-10 flex shrink-0">
        <div
          className="absolute left-0 top-0 w-2.5 h-6 bg-[#8B5CF6]"
          style={{ borderRadius: '5px 0 5px 0' }}
        />
        <div
          className="absolute left-3.5 top-0 w-2.5 h-10 bg-[#EC4899]"
          style={{ borderRadius: '5px 5px 5px 0' }}
        />
        <div className="absolute left-0 top-7.5 w-2.5 h-2.5 bg-[#84CC16] rounded-full" />
      </div>
      <span className="text-2xl font-bold tracking-tight text-foreground font-heading">
        HUYNH YEN.
      </span>
    </div>
  )
}
