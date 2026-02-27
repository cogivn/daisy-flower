import type { Media, Product } from '@/payload-types'

import { Price } from '@/components/Price'
import { Button } from '@/components/ui/button'
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
          <h3 className="line-clamp-1 text-sm font-medium text-foreground">{product.title}</h3>
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
}

