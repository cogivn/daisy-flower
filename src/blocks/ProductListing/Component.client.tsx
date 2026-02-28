/* eslint-disable @next/next/no-img-element */
'use client'

import type { Product } from '@/payload-types'

import { ProductCard } from '@/components/product/ProductCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/utilities/cn'
import React from 'react'

type TabWithProducts = {
  id: string
  label: string
  products: Product[]
}

type ProductListingClientProps = {
  sectionDescription?: string | null
  heading: string
  enableSearch?: boolean
  tabs: TabWithProducts[]
}

export const ProductListingClient: React.FC<ProductListingClientProps> = ({
  sectionDescription,
  heading,
  enableSearch,
  tabs,
}) => {
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [query, setQuery] = React.useState('')

  if (!tabs.length) return null

  const activeTab = tabs[activeIndex] ?? tabs[0]

  const filteredProducts = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return activeTab.products

    return activeTab.products.filter((product) => {
      const title = product.title ?? ''
      return title.toLowerCase().includes(q)
    })
  }, [activeTab.products, query])

  const total = activeTab.products.length
  const visible = filteredProducts.length

  return (
    <section className="bg-white section-spacing">
      <div className="container space-y-4 md:space-y-6">
        {/* Section heading + description */}
        <div className="mb-2 md:mb-4 lg:mb-6 max-w-xl space-y-2">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight uppercase text-foreground">
            {heading}
          </h2>
          {sectionDescription && (
            <p className="text-muted-foreground text-sm md:text-base">
              {sectionDescription}
            </p>
          )}
        </div>
        {/* Tabs + search in one row */}
        <div className="border-b border-border/60 pb-2 text-sm font-medium text-muted-foreground">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab, index) => (
                <Button
                  key={tab.id}
                  type="button"
                  // Use a single variant so font metrics stay identical and avoid \"jitter\"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'px-4 py-1.5 text-xs md:text-sm normal-case tracking-normal font-medium',
                    index === activeIndex
                      ? 'bg-primary text-primary-foreground hover:text-primary-foreground focus-visible:text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  onClick={() => setActiveIndex(index)}
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            {enableSearch && (
              <div className="w-full max-w-xs md:max-w-sm md:text-right">
                <Input
                  type="search"
                  className="h-9 border-border bg-background px-4 text-sm placeholder:text-muted-foreground"
                  placeholder="Search product..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Grid */}
        <div className="grid gap-4 pt-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product as Product} />
          ))}
        </div>

        {/* Footer text */}
        {total > 0 && (
          <p className="pt-2 text-sm text-muted-foreground">
            Showing {visible} of {total} entries
          </p>
        )}
      </div>
    </section>
  )
}

