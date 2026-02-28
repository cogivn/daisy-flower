'use client'

import { Price } from '@/components/Price'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Tag, TicketPercent, X } from 'lucide-react'
import React, { useCallback, useState } from 'react'
import { toast } from 'sonner'

type CartDiscountInfo = {
  id: string | number
  originalSubtotal: number
  voucherCode: string | null
  voucherDiscount: number
  levelDiscount: number
  subtotal: number
}

type VoucherInputProps = {
  onApplied: (data: CartDiscountInfo) => void
  onRemoved: (data: CartDiscountInfo) => void
  currentVoucherCode?: string | null
  currentVoucherDiscount?: number
  disabled?: boolean
}

export const VoucherInput: React.FC<VoucherInputProps> = ({
  onApplied,
  onRemoved,
  currentVoucherCode,
  currentVoucherDiscount = 0,
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
      onApplied(data.cart)
    } catch {
      setError('Something went wrong. Please try again.')
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsApplying(false)
    }
  }, [code, onApplied])

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
      onRemoved(data.cart)
    } catch {
      setError('Something went wrong. Please try again.')
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsRemoving(false)
    }
  }, [onRemoved])

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
      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/5 px-4 py-3">
          <TicketPercent className="h-4 w-4 text-green-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-sm tracking-wider text-green-700 dark:text-green-400">
                {currentVoucherCode}
              </span>
              {currentVoucherDiscount > 0 && (
                <span className="text-xs text-green-600 dark:text-green-500">
                  −<Price amount={currentVoucherDiscount} as="span" />
                </span>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
            onClick={handleRemove}
            disabled={isRemoving || disabled}
            aria-label="Remove voucher"
          >
            {isRemoving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <X className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="voucher-code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase())
              if (error) setError(null)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter voucher code"
            className="pl-9 font-mono tracking-wider uppercase"
            disabled={isApplying || disabled}
          />
        </div>
        <Button
          variant="outline"
          onClick={handleApply}
          disabled={isApplying || !code.trim() || disabled}
          className="shrink-0"
        >
          {isApplying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Applying
            </>
          ) : (
            'Apply'
          )}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
