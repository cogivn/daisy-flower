'use client'
import React, { useCallback, useMemo } from 'react'

import { Category } from '@/payload-types'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import clsx from 'clsx'
import { ChevronRight } from 'lucide-react'

type Props = {
  category: Category
}

export const CategoryItem: React.FC<Props> = ({ category }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const isActive = useMemo(() => {
    return searchParams.get('category') === String(category.id)
  }, [category.id, searchParams])

  const setQuery = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())

    // Changing filters should reset pagination
    params.delete('page')

    if (isActive) {
      params.delete('category')
    } else {
      params.set('category', String(category.id))
    }

    const newParams = params.toString()

    router.push(pathname + '?' + newParams)
  }, [category.id, isActive, pathname, router, searchParams])

  return (
    <button
      onClick={() => setQuery()}
      className={clsx(
        'w-full flex items-center justify-between gap-3 text-left text-sm leading-6 text-foreground underline-offset-4 hover:underline hover:cursor-pointer',
        {
          underline: isActive,
        },
      )}
    >
      <span className="min-w-0 truncate">{category.title}</span>
      <ChevronRight size={16} className="shrink-0 text-muted-foreground" aria-hidden />
    </button>
  )
}
