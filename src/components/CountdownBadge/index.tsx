'use client'
import React, { useState, useEffect } from 'react'
import { cn } from '@/utilities/cn'

interface CountdownBadgeProps {
  endDate: string | Date
  className?: string
}

export const CountdownBadge: React.FC<CountdownBadgeProps> = ({
  endDate,
  className,
}) => {
  // Countdown state
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  } | null>(null)

  // Update countdown every second
  useEffect(() => {
    if (!endDate) return

    const updateCountdown = () => {
      const now = new Date()
      const end = new Date(endDate)
      const diff = end.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
      const minutes = Math.floor((diff / 1000 / 60) % 60)
      const seconds = Math.floor((diff / 1000) % 60)

      setTimeLeft({ days, hours, minutes, seconds })
    }

    // Initial calculation
    updateCountdown()

    // Set up interval
    const interval = setInterval(updateCountdown, 1000)

    // Cleanup
    return () => clearInterval(interval)
  }, [endDate])

  return (
    <div className={cn('absolute top-2 right-2', className)}>
      <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-500 text-white rounded-none text-xs font-medium shadow-sm">
        <span className="font-mono tracking-tight">
          {timeLeft ? 
            `${String(timeLeft.days).padStart(2, '0')}:${String(timeLeft.hours).padStart(2, '0')}:${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}` :
            '00:00:00:00'
          }
        </span>
      </div>
    </div>
  )
}