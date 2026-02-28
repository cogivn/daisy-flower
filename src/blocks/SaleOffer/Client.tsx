'use client'

import Link from 'next/link'
import React, { Suspense } from 'react'

import type { Media as MediaType, Product, SaleEvent, SaleOfferBlock as SaleOfferBlockType } from '@/payload-types'

import { Price } from '@/components/Price'
import { SalePrice } from '@/components/SalePrice'
import { Gallery } from '@/components/product/Gallery'
import { RichText } from '@/components/RichText'
import { Button } from '@/components/ui/button'
import { getEffectivePrice } from '@/utilities/saleEvents'

type CountdownParts = {
  days: string
  hours: string
  minutes: string
  seconds: string
}

const getCountdownParts = (target: Date): CountdownParts => {
  const now = new Date().getTime()
  const distance = target.getTime() - now

  if (distance <= 0) {
    return {
      days: '00',
      hours: '00',
      minutes: '00',
      seconds: '00',
    }
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24))
  const hours = Math.floor((distance / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((distance / (1000 * 60)) % 60)
  const seconds = Math.floor((distance / 1000) % 60)

  return {
    days: days.toString().padStart(2, '0'),
    hours: hours.toString().padStart(2, '0'),
    minutes: minutes.toString().padStart(2, '0'),
    seconds: seconds.toString().padStart(2, '0'),
  }
}

type ClientProps = {
  block: SaleOfferBlockType
  product: Product
  activeSaleEvent: SaleEvent | null
}

export const SaleOfferClient: React.FC<ClientProps> = ({ block, product, activeSaleEvent }) => {
  const { sectionTitle, sectionDescription, highlight } = block
  const linkedProduct = product

  const productGallery =
    linkedProduct?.gallery
      ?.filter((item) => typeof item.image === 'object')
      .map((item) => ({
        ...item,
        image: item.image as MediaType,
      })) || []
  const effectiveGallery = productGallery

  const showCountdown = Boolean(activeSaleEvent?.endsAt)

  const [parts, setParts] = React.useState<CountdownParts>(() =>
    showCountdown && activeSaleEvent?.endsAt
      ? getCountdownParts(new Date(activeSaleEvent.endsAt as string))
      : getCountdownParts(new Date()),
  )

  React.useEffect(() => {
    if (!showCountdown || !activeSaleEvent?.endsAt) return

    const target = new Date(activeSaleEvent.endsAt as string)
    const id = setInterval(() => {
      setParts(getCountdownParts(target))
    }, 1000)

    return () => clearInterval(id)
  }, [activeSaleEvent?.endsAt, showCountdown])

  const isCountdownExpired =
    showCountdown &&
    parts.days === '00' &&
    parts.hours === '00' &&
    parts.minutes === '00' &&
    parts.seconds === '00'

  const isSaleActive = Boolean(activeSaleEvent && !isCountdownExpired)

  // Calculate price directly since we have activeSaleEvent from separate query
  let basePrice = linkedProduct.priceInUSD
  
  // Handle variants
  const variants = linkedProduct.variants?.docs
  if (variants && variants.length > 0) {
    const variant = variants[0]
    if (
      variant &&
      typeof variant === 'object' &&
      variant?.priceInUSD &&
      typeof variant.priceInUSD === 'number'
    ) {
      basePrice = variant.priceInUSD
    }
  }

  const displayPrice = activeSaleEvent ? activeSaleEvent.salePrice : (basePrice || 0)
  const originalPrice = activeSaleEvent ? basePrice : undefined
  const isOnSale = Boolean(activeSaleEvent)



  const displayTitle = linkedProduct?.title
  const productHref = `/products/${linkedProduct.slug}`

  return (
    <section className="debug-outline debug-grid">
      <div className="container section-spacing">
        {(sectionTitle || sectionDescription) && (
          <div className="mb-8 md:mb-10 lg:mb-12 max-w-xl space-y-2">
            {sectionTitle && (
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight uppercase text-foreground">
                {sectionTitle}
              </h2>
            )}
            {sectionDescription && (
              <p className="text-muted-foreground text-sm md:text-base">
                {sectionDescription}
              </p>
            )}
          </div>
        )}
        <div className="grid items-start gap-6 md:gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left: product gallery, reusing product detail logic */}
          <div className="relative space-y-4">
            <Suspense
              fallback={
                <div className="relative aspect-square h-full max-h-[550px] w-full overflow-hidden bg-muted" />
              }
            >
              {Boolean(effectiveGallery?.length) && <Gallery gallery={effectiveGallery} />}
            </Suspense>
          </div>

          {/* Right: content, inspired by product detail layout */}
          <div className="flex flex-col space-y-4">
            {displayTitle && (
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight uppercase">
                {displayTitle}
              </h2>
            )}

            {linkedProduct.description && (
              <div className="text-sm md:text-base text-muted-foreground">
                <RichText
                  data={linkedProduct.description as any}
                  enableGutter={false}
                  enableProse={false}
                  className="prose-sm max-w-none"
                />
              </div>
            )}

            {typeof displayPrice === 'number' && (
              <div className="mt-2 flex items-baseline gap-3 flex-wrap">
                {isOnSale && originalPrice ? (
                  <SalePrice
                    salePrice={displayPrice}
                    originalPrice={originalPrice}
                    salePriceClassName="text-2xl md:text-3xl font-bold text-green-600"
                    originalPriceClassName="text-lg md:text-xl font-semibold text-muted-foreground line-through"
                  />
                ) : (
                  <Price
                    amount={displayPrice}
                    className="text-2xl md:text-3xl font-bold text-primary"
                  />
                )}
              </div>
            )}


            {highlight && (
              <h3 className="text-xs md:text-sm font-semibold tracking-[0.18em] uppercase text-foreground mt-2">
                {highlight}
              </h3>
            )}

            {showCountdown && !isCountdownExpired && (
              <div className="mt-4 flex flex-wrap gap-6 text-xs md:text-sm font-semibold uppercase tracking-[0.16em]">
                <div>
                  <div className="text-lg font-bold">{parts.days}</div>
                  <div className="text-muted-foreground text-[11px]">Day</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{parts.hours}</div>
                  <div className="text-muted-foreground text-[11px]">Hour</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{parts.minutes}</div>
                  <div className="text-muted-foreground text-[11px]">Minutes</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{parts.seconds}</div>
                  <div className="text-muted-foreground text-[11px]">Seconds</div>
                </div>
              </div>
            )}

            <div className="pt-4">
              <Button
                asChild
                className="inline-flex items-center justify-center px-8 py-3 text-xs font-bold uppercase tracking-[0.18em]"
              >
                <Link href={productHref}>Shop this deal</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

