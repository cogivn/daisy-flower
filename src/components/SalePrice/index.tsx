import React from 'react'
import { Price } from '@/components/Price'
import { CountdownTimer } from '@/components/CountdownTimer'
import { cn } from '@/utilities/cn'

interface SalePriceProps {
  salePrice: number
  originalPrice: number
  className?: string
  salePriceClassName?: string
  originalPriceClassName?: string
  currencyCode?: string
  as?: 'div' | 'span' | 'p'
  saleEndDate?: string | Date
  showCountdown?: boolean
  countdownCompact?: boolean
}

export const SalePrice: React.FC<SalePriceProps> = ({
  salePrice,
  originalPrice,
  className,
  salePriceClassName,
  originalPriceClassName,
  currencyCode,
  as = 'div',
  saleEndDate,
  showCountdown = false,
  countdownCompact = true,
}) => {
  const Component = as

  return (
    <Component className={cn('flex flex-col', className)}>
      <div className="flex items-center gap-2">
        <Price
          amount={salePrice}
          className={cn('font-semibold text-green-600', salePriceClassName)}
          currencyCode={currencyCode}
        />
        <Price
          amount={originalPrice}
          className={cn('text-sm text-muted-foreground line-through', originalPriceClassName)}
          currencyCode={currencyCode}
        />
      </div>
      {showCountdown && saleEndDate && (
        <div className="mt-1">
          <CountdownTimer 
            endDate={saleEndDate} 
            compact={countdownCompact}
          />
        </div>
      )}
    </Component>
  )
}