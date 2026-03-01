'use client'

import type { Media, Product } from '@/payload-types'

import { CountdownBadge } from '@/components/CountdownBadge'
import { Price } from '@/components/Price'
import { SaleBadge } from '@/components/SaleBadge'
import { SalePrice } from '@/components/SalePrice'
import { Button } from '@/components/ui/button'
import { useWishlist } from '@/hooks/useWishlist'
import { getEffectivePrice } from '@/utilities/saleEvents'
import { Heart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

type Props = {
  product: Product
}

export const ProductCard: React.FC<Props> = ({ product }) => {
  const { isInWishlist, toggleWishlist } = useWishlist()
  const isFavorite = isInWishlist(product.id)

  const image = ((product.gallery && product.gallery[0] && typeof product.gallery[0] === 'object'
    ? (product.gallery[0] as { image: Media }).image
    : null) ?? product.meta?.image) as Media | null

  const priceInfo = getEffectivePrice(product)
  const { price, originalPrice, isOnSale, saleEvent } = priceInfo

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    void toggleWishlist(product.id)
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
        {image?.url ? (
          <Image
            src={image.url}
            alt={image.alt ?? product.title ?? ''}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}

        {/* Sale Badge */}
        {isOnSale && originalPrice && (
          <SaleBadge originalPrice={originalPrice} salePrice={price} variant="corner" />
        )}

        {/* Countdown Timer Badge - Top Right */}
        {isOnSale && saleEvent?.endsAt && <CountdownBadge endDate={saleEvent.endsAt} />}
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div className="space-y-1.5">
          <h3 className="line-clamp-1 text-sm font-medium text-foreground">{product.title}</h3>
          {typeof price === 'number' && (
            <>
              {isOnSale && originalPrice ? (
                <SalePrice
                  salePrice={price}
                  originalPrice={originalPrice}
                  as="div"
                  className="flex-col items-start gap-0"
                  salePriceClassName="text-sm font-semibold"
                  originalPriceClassName="text-xs"
                />
              ) : (
                <Price as="p" amount={price} className="text-sm font-semibold text-foreground" />
              )}
            </>
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
            className={`transition-colors ${
              isFavorite
                ? 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100 hover:text-red-600'
                : 'bg-background text-foreground hover:bg-primary hover:text-primary-foreground'
            }`}
            aria-label={isFavorite ? 'Remove from wishlist' : 'Add to wishlist'}
            onClick={handleWishlist}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </div>
    </article>
  )
}
