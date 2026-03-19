'use client'

import { Price } from '@/components/Price'
import { Crown, TicketPercent } from 'lucide-react'
import React from 'react'

type PriceBreakdownProps = {
  originalSubtotal: number
  voucherDiscount: number
  levelDiscount: number
  shippingFee: number
  finalTotal: number
  voucherCode?: string | null
  levelName?: string | null
  levelDiscountPercent?: number | null
  taxRates?: Array<{ name: string; rate: number; amount: number }>
  taxMode?: string
}

export const PriceBreakdown: React.FC<PriceBreakdownProps> = ({
  originalSubtotal,
  voucherDiscount,
  levelDiscount,
  shippingFee,
  finalTotal,
  voucherCode,
  levelName,
  levelDiscountPercent,
  taxRates = [],
  taxMode = 'exclusive',
}) => {
  const hasVoucherDiscount = voucherDiscount > 0
  const hasLevelDiscount = levelDiscount > 0
  // In inclusive mode, tax is already contained in prices, but we still render
  // the tax breakdown for transparency.
  const showTaxRows = Boolean(taxRates && taxRates.length > 0)
  const shippingIsFree = shippingFee <= 0

  return (
    <div className="space-y-4 pt-4 border-t border-border">
      {/* Subtotal */}
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-muted-foreground">Subtotal</span>
        <Price amount={originalSubtotal} as="span" className="text-sm font-bold text-foreground" />
      </div>

      {/* Shipping */}
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-muted-foreground">Shipping</span>
        {shippingIsFree ? (
          <span className="text-sm font-bold text-primary">Free</span>
        ) : (
          <span className="text-sm font-bold text-foreground">
            +<Price amount={shippingFee} as="span" />
          </span>
        )}
      </div>

      {/* Voucher discount */}
      {hasVoucherDiscount && (
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5 text-sm font-medium text-[#6E9E6E]">
            <TicketPercent size={14} />
            Voucher {voucherCode ? `(${voucherCode})` : ''}
          </span>
          <span className="text-sm font-bold text-[#6E9E6E]">
            −<Price amount={voucherDiscount} as="span" />
          </span>
        </div>
      )}

      {/* Level discount */}
      {hasLevelDiscount && (
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5 text-sm font-medium text-[#F59E0B]">
            <Crown size={14} />
            {levelName || 'Member'} ({levelDiscountPercent || 0}%)
          </span>
          <span className="text-sm font-bold text-[#F59E0B]">
            −<Price amount={levelDiscount} as="span" />
          </span>
        </div>
      )}

      {/* Taxes */}
      {showTaxRows && (
        <div className="space-y-2">
          {taxRates.map((tax, i) => (
            <div key={i} className="flex justify-between items-center text-sm font-medium text-muted-foreground">
              <span>{tax.name}</span>
              <span className="font-bold text-foreground">
                {taxMode === 'exclusive' ? '+' : taxMode === 'inclusive' ? 'Incl. ' : '+'}
                <Price amount={tax.amount} as="span" />
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Total */}
      <div className="flex justify-between items-center pt-4 border-t border-border">
        <span className="text-base font-bold text-foreground">Total</span>
        <Price className="text-2xl font-bold text-primary" amount={finalTotal} as="span" />
      </div>
    </div>
  )
}
