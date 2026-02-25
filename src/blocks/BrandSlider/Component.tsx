'use client'
import { Media } from '@/components/Media'
import { Brand } from '@/payload-types'
import AutoScroll from 'embla-carousel-auto-scroll'
import useEmblaCarousel from 'embla-carousel-react'
import React from 'react'

export interface BrandSliderProps {
  brands: (Brand | number | null)[]
}

export const BrandSliderBlock: React.FC<BrandSliderProps> = ({ brands }) => {
  const [emblaRef] = useEmblaCarousel({ loop: true }, [
    AutoScroll({ playOnInit: true, speed: 1, stopOnInteraction: false }),
  ])

  if (!brands || brands.length === 0) return null

  return (
    <div className="py-12 border-y bg-neutral-50/50">
      <div className="container">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex items-center">
            {brands.map((brand, i: number) => {
              const brandData = typeof brand === 'object' ? brand : null
              return (
                <div
                  key={i}
                  className="flex-[0_0_200px] min-w-0 px-8 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                >
                  {brandData?.logo && (
                    <div className="relative h-12 w-full">
                      <Media resource={brandData.logo} imgClassName="object-contain" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
