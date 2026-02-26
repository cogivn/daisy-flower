import { Media as MediaComponent } from '@/components/Media'
import { Price } from '@/components/Price'
import type { Media, Product } from '@/payload-types'
import { cn } from '@/utilities/cn'
import { Eye, Heart, ShoppingCart, Star } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

export const Card: React.FC<{
  doc: Product
  className?: string
}> = ({ doc, className }) => {
  const { title, slug, priceInUSD, meta, gallery } = doc
  const mainImage = meta?.image as Media
  const hoverImage = (gallery?.[0]?.image as Media) || null

  return (
    <div className={cn('group bg-white flex flex-col h-full', className)}>
      {/* Image Container */}
      <div className="relative aspect-4/5 overflow-hidden bg-neutral-100 mb-4">
        <Link href={`/products/${slug}`} className="block h-full w-full">
          {mainImage && (
            <MediaComponent
              resource={mainImage}
              fill
              imgClassName={cn(
                'object-cover transition-all duration-700 group-hover:scale-110',
                hoverImage && 'group-hover:opacity-0',
              )}
            />
          )}
          {hoverImage && (
            <MediaComponent
              resource={hoverImage}
              fill
              imgClassName="object-cover transition-all duration-700 opacity-0 group-hover:opacity-100 group-hover:scale-110"
            />
          )}
        </Link>

        {/* Hover Actions */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-8 flex gap-2 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 z-10">
          <button className="w-11 h-11 bg-white shadow-xl flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-300 rounded-full">
            <ShoppingCart size={18} />
          </button>
          <button className="w-11 h-11 bg-white shadow-xl flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-300 rounded-full">
            <Eye size={18} />
          </button>
          <button className="w-11 h-11 bg-white shadow-xl flex items-center justify-center hover:bg-primary hover:text-white transition-all duration-300 rounded-full">
            <Heart size={18} />
          </button>
        </div>

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          <span className="bg-primary text-white text-[10px] font-black px-2.5 py-1 uppercase tracking-widest rounded-sm">
            New
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col grow text-center">
        <div className="flex justify-center mb-2 gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <Link
          href={`/products/${slug}`}
          className="hover:text-primary transition-colors mb-2 inline-block"
        >
          <h3 className="text-base font-semibold tracking-tight leading-tight">{title}</h3>
        </Link>
        <div className="mt-auto">
          {typeof priceInUSD === 'number' && (
            <Price
              amount={priceInUSD}
              className="text-xl font-black text-primary tracking-tighter"
            />
          )}
        </div>
      </div>
    </div>
  )
}
