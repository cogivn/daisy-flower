import type { Product, Variant } from '@/payload-types'

import Link from 'next/link'
import React from 'react'
import clsx from 'clsx'
import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import { SaleBadge } from '@/components/SaleBadge'
import { SalePrice } from '@/components/SalePrice'
import { CountdownBadge } from '@/components/CountdownBadge'
import { getEffectivePrice } from '@/utilities/saleEvents'

type Props = {
  product: Partial<Product>
}

export const ProductGridItem: React.FC<Props> = ({ product }) => {
  const { gallery, title } = product

  const priceInfo = getEffectivePrice(product)
  const { price, originalPrice, isOnSale, saleEvent } = priceInfo

  const image =
    gallery?.[0]?.image && typeof gallery[0]?.image !== 'string' ? gallery[0]?.image : false

  return (
    <Link className="relative inline-block h-full w-full group" href={`/products/${product.slug}`}>
      <div className="relative">
        {image ? (
          <Media
            className={clsx(
              'relative aspect-square object-cover border rounded-2xl p-8 bg-primary-foreground',
            )}
            height={80}
            imgClassName={clsx('h-full w-full object-cover rounded-2xl', {
              'transition duration-300 ease-in-out group-hover:scale-102': true,
            })}
            resource={image}
            width={80}
          />
        ) : null}
        
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
      </div>

      <div className="font-mono text-primary/50 group-hover:text-primary flex justify-between items-center mt-4">
        <div>{title}</div>

        {typeof price === 'number' && (
          <div className="">
            {isOnSale && originalPrice ? (
              <SalePrice
                salePrice={price}
                originalPrice={originalPrice}
                as="div"
                className="flex-col items-end gap-0"
                salePriceClassName="text-sm font-semibold"
                originalPriceClassName="text-xs"
              />
            ) : (
              <Price amount={price} />
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
