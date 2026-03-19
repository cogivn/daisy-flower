'use client'

import { Input } from '@/components/ui/input'
import { Loader2, Ticket, X } from 'lucide-react'
import React, { useCallback, useState } from 'react'
import { toast } from 'sonner'

type CartDiscountInfo = {
  id: string | number
  originalSubtotal: number
  voucherCode: string | null
  voucherDiscount: number
  levelDiscount: number
  subtotal: number
  taxAmount?: number
  taxRates?: Array<{ name: string; rate: number; amount: number }>
}

type VoucherInputProps = {
  onAppliedAction: (data: CartDiscountInfo) => void
  onRemovedAction: (data: CartDiscountInfo) => void
  currentVoucherCode?: string | null
  disabled?: boolean
}

export const VoucherInput: React.FC<VoucherInputProps> = ({
  onAppliedAction,
  onRemovedAction,
  currentVoucherCode,
  disabled = false,
}) => {
  const [code, setCode] = useState('')
  const [isApplying, setIsApplying] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasAppliedVoucher = Boolean(currentVoucherCode)

  const handleApply = useCallback(async () => {
    if (!code.trim()) {
      setError('Please enter a voucher code.')
      return
    }

    setIsApplying(true)
    setError(null)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/voucher-apply`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error || 'Failed to apply voucher.')
        toast.error(data.error || 'Failed to apply voucher.')
        return
      }

      toast.success(`Voucher "${data.cart.voucherCode}" applied!`)
      setCode('')
      setError(null)
      onAppliedAction(data.cart)
    } catch {
      setError('Something went wrong. Please try again.')
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsApplying(false)
    }
  }, [code, onAppliedAction])

  const handleRemove = useCallback(async () => {
    setIsRemoving(true)
    setError(null)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/voucher-remove`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error || 'Failed to remove voucher.')
        toast.error(data.error || 'Failed to remove voucher.')
        return
      }

      toast.success('Voucher removed.')
      onRemovedAction(data.cart)
    } catch {
      setError('Something went wrong. Please try again.')
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsRemoving(false)
    }
  }, [onRemovedAction])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        if (!isApplying && !hasAppliedVoucher && code.trim()) {
          void handleApply()
        }
      }
    },
    [handleApply, isApplying, hasAppliedVoucher, code],
  )

  if (hasAppliedVoucher) {
    return (
      <div className="flex items-center justify-between h-[52px] px-4 bg-[#F0FDF4] border border-[#BBF7D0]">
        <div className="flex items-center gap-3">
          <Ticket size={18} className="text-[#22C55E]" />
          <span className="text-[14px] font-semibold text-[#1A1A1C]">{currentVoucherCode}</span>
          <span className="text-[12px] font-normal text-[#22C55E]">applied</span>
        </div>
        <button
          onClick={handleRemove}
          disabled={isRemoving || disabled}
          className="p-1 text-[#6E6E70] hover:text-[#1A1A1C] transition-colors"
        >
          {isRemoving ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Pencil ylQYb: single-row voucher bar (height 52, px-16, border) */}
      <div className="h-[52px] w-full flex items-center justify-between px-4 bg-white border border-[#F0F0F2]">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Ticket size={18} className="text-[#6E6E70] shrink-0" aria-hidden="true" />
          <Input
            value={code}
            onChange={(e) => {
              setCode(e.target.value)
              if (error) setError(null)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Discount code"
            className="h-full border-0 bg-transparent px-0 text-[14px] font-normal text-[#1A1A1C] placeholder:text-[#A0A0A5] shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={isApplying || disabled}
          />
        </div>
        <button
          type="button"
          onClick={() => void handleApply()}
          disabled={isApplying || !code.trim() || disabled}
          className="text-[14px] font-bold text-[#6E9E6E] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isApplying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
        </button>
      </div>
      {error && <p className="text-xs text-destructive font-medium">{error}</p>}
    </div>
  )
}
