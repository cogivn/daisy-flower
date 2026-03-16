'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { formatCurrency } from '@/utilities/currency'

const MIN_PRICE = 0
const MAX_PRICE = 5_000_000
const STEP = 50_000

export function PriceFilter() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  const urlMin = Number(searchParams.get('minPrice') ?? MIN_PRICE)
  const urlMax = Number(searchParams.get('maxPrice') ?? MAX_PRICE)

  const initialMin = Number.isFinite(urlMin) ? urlMin : MIN_PRICE
  const initialMax = Number.isFinite(urlMax) ? urlMax : MAX_PRICE

  const [range, setRange] = useState<[number, number]>([
    Math.min(Math.max(MIN_PRICE, initialMin), MAX_PRICE),
    Math.min(Math.max(MIN_PRICE, initialMax), MAX_PRICE),
  ])

  const [min, max] = range

  useEffect(() => {
    const nextMin = Number.isFinite(urlMin) ? urlMin : MIN_PRICE
    const nextMax = Number.isFinite(urlMax) ? urlMax : MAX_PRICE
    const clampedMin = Math.min(Math.max(MIN_PRICE, nextMin), MAX_PRICE)
    const clampedMax = Math.min(Math.max(MIN_PRICE, nextMax), MAX_PRICE)
    setRange([Math.min(clampedMin, clampedMax), Math.max(clampedMin, clampedMax)])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlMin, urlMax])

  const applyFilter = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())

    if (min <= MIN_PRICE) {
      params.delete('minPrice')
    } else {
      params.set('minPrice', String(min))
    }

    if (max >= MAX_PRICE) {
      params.delete('maxPrice')
    } else {
      params.set('maxPrice', String(max))
    }

    router.push(`${pathname}?${params.toString()}`)
  }, [max, min, pathname, router, searchParams])

  const sliderValue = useMemo(() => [min, max], [min, max])

  return (
    <div className="space-y-3">
      <h3 className="text-xs mb-1 font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Filter by price
      </h3>
      <div className="flex flex-col gap-4">
        <div className="pt-2">
          <Slider
            value={sliderValue}
            min={MIN_PRICE}
            max={MAX_PRICE}
            step={STEP}
            minStepsBetweenThumbs={1}
            onValueChange={(value) => {
              const nextMin = value?.[0] ?? MIN_PRICE
              const nextMax = value?.[1] ?? MAX_PRICE
              setRange([nextMin, nextMax])
            }}
          />
        </div>
        <div className="flex flex-col gap-3">
          <span className="text-xs font-medium text-foreground">
            {formatCurrency(min)} - {formatCurrency(max)}
          </span>
          <Button
            type="button"
            size="sm"
            variant="default"
            className="rounded-none px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em]"
            onClick={applyFilter}
          >
            Filter
          </Button>
        </div>
      </div>
    </div>
  )
}

