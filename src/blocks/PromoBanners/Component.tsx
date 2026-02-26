import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import { cn } from '@/utilities/cn'
import React from 'react'

export const PromoBannersBlock: React.FC<any> = ({ banners }) => {
  if (!banners || banners.length === 0) return null

  const gridCols =
    banners.length === 1
      ? 'grid-cols-1'
      : banners.length === 2
        ? 'grid-cols-1 md:grid-cols-2'
        : 'grid-cols-1 md:grid-cols-3'

  return (
    <div className="py-12 md:py-20">
      <div className="container">
        <div className={cn('grid gap-4 md:gap-8', gridCols)}>
          {banners.map((banner: any, i: number) => (
            <div key={i} className="relative group overflow-hidden h-[220px] sm:h-[250px] md:h-[350px]">
              {banner.media && (
                <Media
                  resource={banner.media}
                  fill
                  imgClassName="object-cover group-hover:scale-110 transition-transform duration-700"
                />
              )}
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
              <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 z-10 md:inset-x-8">
                {banner.subtitle && (
                  <p className="text-white font-medium uppercase tracking-[0.2em] mb-2 text-sm">
                    {banner.subtitle}
                  </p>
                )}
                <h3 className="text-white text-2xl md:text-3xl font-bold mb-6 max-w-50 leading-tight">
                  {banner.title}
                </h3>
                {banner.link && (
                  <CMSLink
                    {...banner.link}
                    className="text-white font-bold border-b-2 border-white pb-1 hover:text-primary hover:border-primary transition-all uppercase text-xs tracking-widest"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
