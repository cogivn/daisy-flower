'use client'

import { useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/button'

export function ClearFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const hasAnyFilters = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page')

    return (
      Boolean(params.get('q')) ||
      Boolean(params.get('category')) ||
      Boolean(params.get('sort')) ||
      Boolean(params.get('minPrice')) ||
      Boolean(params.get('maxPrice'))
    )
  }, [searchParams])

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="rounded-none w-full justify-center text-xs font-semibold uppercase tracking-[0.18em]"
      disabled={!hasAnyFilters}
      onClick={() => {
        // Reset all filters (and pagination) back to /shop
        router.push(pathname.split('?')[0] || '/shop')
      }}
    >
      Clear filters
    </Button>
  )
}

