import React from 'react'
import { Badge } from '@/components/ui/badge'
import { calculateDiscountPercentage } from '@/utilities/saleEvents'
import { cn } from '@/utilities/cn'

interface SaleBadgeProps {
  originalPrice: number
  salePrice: number
  className?: string
  variant?: 'default' | 'compact' | 'corner'
}

export const SaleBadge: React.FC<SaleBadgeProps> = ({
  originalPrice,
  salePrice,
  className,
  variant = 'default',
}) => {
  const discountPercentage = calculateDiscountPercentage(originalPrice, salePrice)
  
  if (discountPercentage <= 0) return null

  const baseClasses = 'font-semibold text-white bg-green-500 hover:bg-green-600 border-green-500'
  
  if (variant === 'corner') {
    return (
      <div className={cn(
        'absolute top-2 left-2 z-10',
        className
      )}>
        <Badge className={cn(baseClasses, 'text-xs px-2 py-1 rounded-none')}>
          -{discountPercentage}%
        </Badge>
      </div>
    )
  }
  
  if (variant === 'compact') {
    return (
      <Badge className={cn(baseClasses, 'text-xs px-2 py-1 rounded-none', className)}>
        -{discountPercentage}%
      </Badge>
    )
  }

  return (
    <Badge className={cn(baseClasses, 'text-sm px-3 py-1 rounded-none', className)}>
      SALE -{discountPercentage}%
    </Badge>
  )
}