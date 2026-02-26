/* eslint-disable @next/next/no-img-element */
'use client'

import type { Media, Product } from '@/payload-types'

import { Price } from '@/components/Price'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/utilities/cn'
import { Heart } from 'lucide-react'
import Link from 'next/link'
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
    <section className="bg-white section-spacing border-b">
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
                  variant={index === activeIndex ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    'px-4 py-1.5 text-xs md:text-sm normal-case tracking-normal font-medium',
                    index === activeIndex
                      ? 'bg-primary text-primary-foreground'
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
          {filteredProducts.map((product) => {
            const image = (product.meta?.image ?? product.gallery?.[0]) as Media | null

            let price = product.priceInUSD

            if (product.enableVariants && product.variants?.docs?.length) {
              const variant = product.variants.docs[0]

              if (variant && typeof variant === 'object' && (variant as any).priceInUSD) {
                price = (variant as any).priceInUSD
              }
            }

            return (
              <article
                key={product.id}
                className="group flex h-full flex-col overflow-hidden border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                {/* Image: 2:3 ratio card */}
                <Link
                  href={`/products/${product.slug}`}
                  className="relative block overflow-hidden aspect-2/3"
                >
                  {image && typeof image === 'object' && 'url' in image ? (
                    <img
                      src={(image as any).url as string}
                      alt={(image as any).alt ?? product.title ?? ''}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-muted" />
                  )}
                </Link>

                {/* Content */}
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div className="space-y-1.5">
                    <h3 className="line-clamp-1 text-sm font-medium text-foreground">
                      {product.title}
                    </h3>
                    {typeof price === 'number' && (
                      <Price
                        as="p"
                        amount={price}
                        className="text-sm font-semibold text-foreground"
                      />
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <Link
                      href={`/products/${product.slug}`}
                      className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                    >
                      View details
                    </Link>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="bg-background text-foreground hover:bg-primary hover:text-primary-foreground"
                      aria-label="Add to wishlist"
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </article>
            )
          })}
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

