import type { Media, Product } from '@/payload-types'

import { Price } from '@/components/Price'
import { Button } from '@/components/ui/button'
import { SaleBadge } from '@/components/SaleBadge'
import { SalePrice } from '@/components/SalePrice'
import { CountdownBadge } from '@/components/CountdownBadge'
import { getEffectivePrice } from '@/utilities/saleEvents'
import { Heart } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

type Props = {
  product: Product
}

export const ProductCard: React.FC<Props> = ({ product }) => {
  const image = (product.meta?.image ??
    (product.gallery && product.gallery[0] && typeof product.gallery[0] === 'object'
      ? (product.gallery[0] as any).image
      : null)) as Media | null

  const priceInfo = getEffectivePrice(product)
  const { price, originalPrice, isOnSale, saleEvent } = priceInfo

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
        
        {/* Sale Badge */}
        {isOnSale && originalPrice && (
          <SaleBadge
            originalPrice={originalPrice}
            salePrice={price}
            variant="corner"
          />
        )}

        {/* Countdown Timer Badge - Top Right */}
        {isOnSale && saleEvent?.endsAt && (
          <CountdownBadge endDate={saleEvent.endsAt} />
        )}
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
                <Price
                  as="p"
                  amount={price}
                  className="text-sm font-semibold text-foreground"
                />
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
            className="bg-background text-foreground hover:bg-primary hover:text-primary-foreground"
            aria-label="Add to wishlist"
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </article>
  )
}

