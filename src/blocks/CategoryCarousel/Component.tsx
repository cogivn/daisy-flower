'use client'
import { Media } from '@/components/Media'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { Category } from '@/payload-types'

export interface CategoryCarouselProps {
  categories: (Category | number | null)[]
}

export const CategoryCarouselBlock: React.FC<CategoryCarouselProps> = ({ categories }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' })

  if (!categories || categories.length === 0) return null

  return (
    <div className="py-20 bg-white">
      <div className="container relative group">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-bold tracking-tight">Shop by Category</h2>
          <div className="flex gap-2">
            <button
              onClick={() => emblaApi?.scrollPrev()}
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => emblaApi?.scrollNext()}
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {categories.map((category, i: number) => {
              const categoryData = typeof category === 'object' ? category : null
              return (
                <div
                  key={i}
                  className="flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_25%] min-w-0 px-4"
                >
                  <Link href={`/shop?category=${categoryData?.slug}`} className="block group/item">
                    <div className="relative aspect-4/5 overflow-hidden bg-neutral-100 mb-6">
                      {categoryData?.image && (
                        <Media
                          resource={categoryData.image}
                          fill
                          imgClassName="object-cover transition-transform duration-700 group-hover/item:scale-110"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/10 transition-colors" />
                    </div>
                    <h3 className="text-xl font-bold text-center hover:text-primary transition-colors">
                      {categoryData?.title}
                    </h3>
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
