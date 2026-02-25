'use client'

import { cn } from '@/utilities/cn'
import { createUrl } from '@/utilities/createUrl'
import { SearchIcon } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import React from 'react'

import { Category } from '@/payload-types'
import { ChevronDown } from 'lucide-react'

type Props = {
  className?: string
  categories?: (Category | number | null)[]
}

export const Search: React.FC<Props> = ({ className, categories }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all')

  const categoryList =
    categories?.filter((cat): cat is Category => typeof cat === 'object' && cat !== null) || []

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const val = e.target as HTMLFormElement
    const search = val.search as HTMLInputElement
    const newParams = new URLSearchParams(searchParams.toString())

    if (search.value) {
      newParams.set('q', search.value)
    } else {
      newParams.delete('q')
    }

    if (selectedCategory !== 'all') {
      newParams.set('category', selectedCategory)
    } else {
      newParams.delete('category')
    }

    router.push(createUrl('/shop', newParams))
  }

  return (
    <form className={cn('relative w-full flex items-center', className)} onSubmit={onSubmit}>
      {/* Category Dropdown */}
      <div className="relative group/search-cat border-r border-neutral-200 h-full hidden lg:block">
        <div className="h-full flex items-center px-4 cursor-pointer min-w-40 justify-between text-sm font-medium hover:text-primary transition-colors">
          <span>
            {categoryList.find((c) => c.slug === selectedCategory)?.title || 'All Categories'}
          </span>
          <ChevronDown size={14} />
        </div>
        <div className="absolute top-full left-0 bg-background border shadow-lg hidden group-hover/search-cat:block z-50 min-w-full py-2 max-h-75 overflow-y-auto">
          <div
            onClick={() => setSelectedCategory('all')}
            className="px-4 py-2 hover:bg-muted cursor-pointer text-sm"
          >
            All Categories
          </div>
          {categoryList.map((cat) => (
            <div
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug || '')}
              className="px-4 py-2 hover:bg-muted cursor-pointer text-sm"
            >
              {cat.title}
            </div>
          ))}
        </div>
      </div>

      <input
        autoComplete="off"
        className="grow rounded-none bg-background px-6 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none border-none focus:outline-none focus:ring-0 focus:border-none"
        defaultValue={searchParams?.get('q') || ''}
        key={searchParams?.get('q')}
        name="search"
        placeholder="Search product..."
        type="text"
      />
      <button
        type="submit"
        className="w-12 h-full flex items-center justify-center text-muted-foreground hover:text-primary transition-colors pr-2"
      >
        <SearchIcon size={20} />
      </button>
    </form>
  )
}
