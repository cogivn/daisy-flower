'use client'

import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import type { Category, Media as MediaType, ShopByCategoriesBlock } from '@/payload-types'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

type Props = ShopByCategoriesBlock

function isCategory(c: Category | number | null): c is Category {
  return c !== null && typeof c === 'object' && 'slug' in c
}

export const ShopByCategoriesBlockComponent: React.FC<Props> = (props) => {
  const { title, description, exploreMoreLink, categories } = props

  const list = Array.isArray(categories) ? categories.filter(isCategory) : []

  if (list.length === 0) return null

  return (
    <section className="debug-outline debug-grid">
      <div className="container section-spacing">
        {/* Header: title + description left, Explore More right */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8 md:mb-10 lg:mb-12">
          <div className="space-y-2 max-w-xl">
            {title && (
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight uppercase text-foreground">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-muted-foreground text-sm md:text-base">
                {description}
              </p>
            )}
          </div>
          {exploreMoreLink && (exploreMoreLink.url || exploreMoreLink.reference) && (
            <div className="shrink-0">
              <CMSLink
                {...exploreMoreLink}
                appearance="default"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-8 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white hover:bg-primary/90 transition-colors"
              >
                {exploreMoreLink.label || 'Explore More'}
                <ArrowRight className="w-4 h-4" />
              </CMSLink>
            </div>
          )}
        </div>

        {/* 2×2 grid of category cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          {list.map((category) => {
            const media = category.image && typeof category.image === 'object' ? (category.image as MediaType) : null
            const slug = category.slug ?? ''

            return (
              <Link
                key={category.id}
                href={`/shop?category=${slug}`}
                className="group/card block relative overflow-hidden rounded-lg aspect-4/3 min-h-[220px] sm:min-h-[260px] md:aspect-6/5"
              >
                {/* Background image */}
                <div className="absolute inset-0 bg-muted">
                  {media ? (
                    <Media
                      resource={media}
                      fill
                      imgClassName="object-cover transition-transform duration-500 group-hover/card:scale-105"
                    />
                  ) : null}
                </div>
                {/* Dark overlay for text readability */}
                <div className="absolute inset-0 bg-black/50 group-hover/card:bg-black/45 transition-colors" />
                {/* Content: title + description bottom-left, EXPLORE NOW bottom-right */}
                <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-5 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4">
                    <div className="min-w-0">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-tight uppercase text-white mb-1">
                        {category.title}
                      </h3>
                      {category.description && (
                        <p className="text-white/90 text-sm md:text-base line-clamp-2">
                          {category.description}
                        </p>
                      )}
                    </div>
                    <span className="inline-flex items-center justify-center border-2 border-white px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white w-fit shrink-0 hover:bg-white hover:text-foreground transition-colors">
                      Explore Now
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
