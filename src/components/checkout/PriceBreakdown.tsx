'use client'

import { Price } from '@/components/Price'
import { Crown, Minus, TicketPercent } from 'lucide-react'
import React from 'react'

type PriceBreakdownProps = {
  originalSubtotal: number
  voucherDiscount: number
  levelDiscount: number
  finalTotal: number
  voucherCode?: string | null
  levelName?: string | null
  levelDiscountPercent?: number | null
}

export const PriceBreakdown: React.FC<PriceBreakdownProps> = ({
  originalSubtotal,
  voucherDiscount,
  levelDiscount,
  finalTotal,
  voucherCode,
  levelName,
  levelDiscountPercent,
}) => {
  const hasVoucherDiscount = voucherDiscount > 0
  const hasLevelDiscount = levelDiscount > 0
  const hasAnyDiscount = hasVoucherDiscount || hasLevelDiscount
  const totalSaved = voucherDiscount + levelDiscount

  return (
    <div className="space-y-3">
      {/* Subtotal */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">Subtotal</span>
        <Price amount={originalSubtotal} as="span" />
      </div>

      {/* Voucher discount */}
      {hasVoucherDiscount && (
        <div className="flex justify-between items-center text-sm">
          <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
            <TicketPercent className="h-3.5 w-3.5" />
            <span>
              Voucher
              {voucherCode && (
                <span className="font-mono text-xs ml-1 opacity-75">({voucherCode})</span>
              )}
            </span>
          </span>
          <span className="text-green-600 dark:text-green-400 font-medium">
            −<Price amount={voucherDiscount} as="span" />
          </span>
        </div>
      )}

      {/* Level discount */}
      {hasLevelDiscount && (
        <div className="flex justify-between items-center text-sm">
          <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <Crown className="h-3.5 w-3.5" />
            <span>
              {levelName || 'Member'} discount
              {levelDiscountPercent != null && levelDiscountPercent > 0 && (
                <span className="text-xs ml-1 opacity-75">({levelDiscountPercent}%)</span>
              )}
            </span>
          </span>
          <span className="text-amber-600 dark:text-amber-400 font-medium">
            −<Price amount={levelDiscount} as="span" />
          </span>
        </div>
      )}

      {/* Savings summary */}
      {hasAnyDiscount && (
        <div className="flex justify-between items-center text-sm py-1.5 px-3 rounded-md bg-green-500/5 border border-green-500/10">
          <span className="text-green-700 dark:text-green-400 font-medium flex items-center gap-1.5">
            <Minus className="h-3 w-3" />
            You save
          </span>
          <span className="text-green-700 dark:text-green-400 font-semibold">
            <Price amount={totalSaved} as="span" />
          </span>
        </div>
      )}

      {/* Divider */}
      <hr className="border-border" />

      {/* Total */}
      <div className="flex justify-between items-center">
        <span className="uppercase font-medium">Total</span>
        <Price className="text-3xl font-medium" amount={finalTotal} as="span" />
      </div>
    </div>
  )
}
