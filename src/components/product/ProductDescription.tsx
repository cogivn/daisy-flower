'use client'
import type { Product, Variant } from '@/payload-types'

import { AddToCart } from '@/components/Cart/AddToCart'
import { Price } from '@/components/Price'
import { RichText } from '@/components/RichText'
import { SaleBadge } from '@/components/SaleBadge'
import { SalePrice } from '@/components/SalePrice'
import { getEffectivePrice } from '@/utilities/saleEvents'
import { Suspense } from 'react'

import { StockIndicator } from '@/components/product/StockIndicator'
import { VariantSelector } from './VariantSelector'

export function ProductDescription({ product }: { product: Product }) {
  let amount = 0,
    lowestAmount = 0,
    highestAmount = 0
  const hasVariants = product.enableVariants && Boolean(product.variants?.docs?.length)

  // Get sale information for non-variant products
  const priceInfo = getEffectivePrice(product)
  const { price: effectivePrice, originalPrice, isOnSale, saleEvent } = priceInfo

  if (hasVariants) {
    const variantsOrderedByPrice = product.variants?.docs
      ?.filter((variant) => variant && typeof variant === 'object')
      .sort((a, b) => {
        if (
          typeof a === 'object' &&
          typeof b === 'object' &&
          'priceInVND' in a &&
          'priceInVND' in b &&
          typeof a.priceInVND === 'number' &&
          typeof b.priceInVND === 'number'
        ) {
          return a.priceInVND - b.priceInVND
        }

        return 0
      }) as Variant[]

    if (variantsOrderedByPrice.length > 0) {
      const lowestVariantPrice = variantsOrderedByPrice[0].priceInVND
      const highestVariantPrice =
        variantsOrderedByPrice[variantsOrderedByPrice.length - 1].priceInVND

      if (typeof lowestVariantPrice === 'number' && typeof highestVariantPrice === 'number') {
        lowestAmount = lowestVariantPrice
        highestAmount = highestVariantPrice
      }
    }
  } else if (product.priceInVND && typeof product.priceInVND === 'number') {
    amount = product.priceInVND
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-medium">{product.title}</h1>
          {!hasVariants && isOnSale && originalPrice != null && (
            <SaleBadge originalPrice={originalPrice} salePrice={effectivePrice} variant="compact" />
          )}
        </div>
        <div className="uppercase font-mono">
          {hasVariants ? (
            <Price highestAmount={highestAmount} lowestAmount={lowestAmount} />
          ) : (
            <>
              {isOnSale && originalPrice != null ? (
                <SalePrice
                  salePrice={effectivePrice}
                  originalPrice={originalPrice}
                  as="div"
                  className="flex-col items-end gap-0"
                  salePriceClassName="text-lg font-bold"
                  originalPriceClassName="text-sm"
                  saleEndDate={saleEvent?.endsAt}
                  showCountdown={true}
                  countdownCompact={false}
                />
              ) : (
                <Price amount={amount} />
              )}
            </>
          )}
        </div>
      </div>
      {product.description ? (
        <RichText className="" data={product.description} enableGutter={false} />
      ) : null}
      <hr />
      {hasVariants && (
        <>
          <Suspense fallback={null}>
            <VariantSelector product={product} />
          </Suspense>

          <hr />
        </>
      )}
      <div className="flex items-center justify-between">
        <Suspense fallback={null}>
          <StockIndicator product={product} />
        </Suspense>
      </div>

      <div className="flex items-center justify-between">
        <Suspense fallback={null}>
          <AddToCart product={product} />
        </Suspense>
      </div>
    </div>
  )
}
