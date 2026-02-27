'use client'

import { cn } from '@/utilities/cn'
import { createUrl } from '@/utilities/createUrl'
import { ChevronDown, SearchIcon, X } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React from 'react'

import type { Category } from '@/payload-types'

type Props = {
  className?: string
  categories?: (Category | number | null)[]
}

export const Search: React.FC<Props> = ({ className, categories }) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all')
  const [query, setQuery] = React.useState<string>(searchParams.get('q') || '')
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const didMountRef = React.useRef(false)
  const [showCategoryDropdown, setShowCategoryDropdown] = React.useState(false)

  const categoryList =
    categories?.filter((cat): cat is Category => typeof cat === 'object' && cat !== null) || []

  React.useEffect(() => {
    setQuery(searchParams.get('q') || '')
    const categoryParam = searchParams.get('category')
    setSelectedCategory(categoryParam || 'all')
  }, [searchParams])

  // Debounced search: run automatically 500ms after user stops typing / changes category
  React.useEffect(() => {
    // Skip on first mount to avoid double-running initial URL state
    if (!didMountRef.current) {
      didMountRef.current = true
      return
    }

    // Chỉ auto-search khi đang đứng trên trang /shop
    if (!pathname.startsWith('/shop')) {
      return
    }

    const trimmed = query.trim()

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      applySearch(trimmed, selectedCategory)
    }, 500)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, selectedCategory, pathname])

  function applySearch(nextQuery: string, nextCategory: string) {
    const newParams = new URLSearchParams(searchParams.toString())

    if (nextQuery) {
      newParams.set('q', nextQuery)
    } else {
      newParams.delete('q')
    }

    if (nextCategory !== 'all') {
      newParams.set('category', nextCategory)
    } else {
      newParams.delete('category')
    }

    router.push(createUrl('/shop', newParams))
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    applySearch(query.trim(), selectedCategory)
  }

  const hasActiveFilters = Boolean(query.trim() || selectedCategory !== 'all')

  function onClear() {
    setQuery('')
    setSelectedCategory('all')
    applySearch('', 'all')
  }

  return (
    <form className={cn('relative w-full flex items-center', className)} onSubmit={onSubmit}>
      {/* Category Dropdown */}
      <div className="relative border-r border-neutral-200 h-full hidden lg:block overflow-visible">
        <button
          type="button"
          className="h-full flex items-center px-4 cursor-pointer min-w-40 justify-between text-sm font-medium hover:text-primary transition-colors w-full text-left"
          onClick={() => setShowCategoryDropdown((prev) => !prev)}
          aria-haspopup="listbox"
          aria-expanded={showCategoryDropdown}
        >
          <span>
            {categoryList.find((c) => String(c.id) === selectedCategory)?.title || 'All Categories'}
          </span>
          <ChevronDown size={14} />
        </button>
        <div
          className={cn(
            'absolute top-full left-0 bg-background border shadow-lg z-60 min-w-full py-2 max-h-75 overflow-y-auto',
            showCategoryDropdown ? 'block' : 'hidden',
          )}
          role="listbox"
        >
          <div
            onClick={() => {
              setSelectedCategory('all')
              setShowCategoryDropdown(false)
            }}
            className="px-4 py-2 hover:bg-muted cursor-pointer text-sm"
          >
            All Categories
          </div>
          {categoryList.map((cat) => (
            <div
              key={cat.id}
              onClick={() => {
                setSelectedCategory(String(cat.id))
                setShowCategoryDropdown(false)
              }}
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
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        name="search"
        placeholder="Search product..."
        type="text"
      />
      <button
        type={hasActiveFilters ? 'button' : 'submit'}
        onClick={hasActiveFilters ? onClear : undefined}
        className="w-12 h-full flex items-center justify-center text-muted-foreground hover:text-primary transition-colors pr-2"
        aria-label={hasActiveFilters ? 'Clear search and category filters' : 'Search products'}
      >
        {hasActiveFilters ? <X size={18} /> : <SearchIcon size={20} />}
      </button>
    </form>
  )
}

