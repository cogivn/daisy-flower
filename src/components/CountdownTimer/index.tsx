'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/utilities/cn'

interface CountdownTimerProps {
  endDate: string | Date
  className?: string
  showLabels?: boolean
  compact?: boolean
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  endDate,
  className,
  showLabels = true,
  compact = false,
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(endDate) - +new Date()

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)
        const minutes = Math.floor((difference / 1000 / 60) % 60)
        const seconds = Math.floor((difference / 1000) % 60)

        setTimeLeft({ days, hours, minutes, seconds })
        setIsExpired(false)
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        setIsExpired(true)
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [endDate])

  if (isExpired) {
    return (
      <div className={cn('text-sm text-muted-foreground', className)}>
        Sale ended
      </div>
    )
  }

  if (compact) {
    return (
      <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/60 rounded-full text-xs font-medium', className)}>
        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-green-700 font-mono tracking-tight">
          {timeLeft.days > 0 && (
            <span className="font-semibold">{timeLeft.days}d </span>
          )}
          <span className="font-semibold">
            {String(timeLeft.hours).padStart(2, '0')}:
            {String(timeLeft.minutes).padStart(2, '0')}:
            {String(timeLeft.seconds).padStart(2, '0')}
          </span>
        </span>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {timeLeft.days > 0 && (
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-green-600">{timeLeft.days}</span>
          {showLabels && <span className="text-xs text-muted-foreground">days</span>}
        </div>
      )}
      <div className="flex flex-col items-center">
        <span className="text-lg font-bold text-green-600">
          {String(timeLeft.hours).padStart(2, '0')}
        </span>
        {showLabels && <span className="text-xs text-muted-foreground">hrs</span>}
      </div>
      <span className="text-green-600 font-bold">:</span>
      <div className="flex flex-col items-center">
        <span className="text-lg font-bold text-green-600">
          {String(timeLeft.minutes).padStart(2, '0')}
        </span>
        {showLabels && <span className="text-xs text-muted-foreground">min</span>}
      </div>
      <span className="text-green-600 font-bold">:</span>
      <div className="flex flex-col items-center">
        <span className="text-lg font-bold text-green-600">
          {String(timeLeft.seconds).padStart(2, '0')}
        </span>
        {showLabels && <span className="text-xs text-muted-foreground">sec</span>}
      </div>
    </div>
  )
}