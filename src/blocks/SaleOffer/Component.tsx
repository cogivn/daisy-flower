'use client'

import React, { Suspense } from 'react'
import Link from 'next/link'

import type {
  Media as MediaType,
  Product,
  SaleEvent,
  SaleOfferBlock as SaleOfferBlockType,
} from '@/payload-types'

import { Gallery } from '@/components/product/Gallery'
import { Button } from '@/components/ui/button'
import { RichText } from '@/components/RichText'

type Props = SaleOfferBlockType

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

export const SaleOfferBlockComponent: React.FC<Props> = (props) => {
  const {
    sectionTitle,
    sectionDescription,
    highlight,
    product,
  } = props
  const [activeIndex, setActiveIndex] = React.useState(0)

  const linkedProduct = (typeof product === 'object' ? (product as Product) : null) || null

  if (!linkedProduct) return null

  const productGallery =
    linkedProduct?.gallery
      ?.filter((item) => typeof item.image === 'object')
      .map((item) => ({
        ...item,
        image: item.image as MediaType,
      })) || []
  const effectiveGallery = productGallery

  const saleEvents = Array.isArray(linkedProduct.saleEvents)
    ? (linkedProduct.saleEvents as (number | SaleEvent)[])
    : []

  const activeSaleEvent = saleEvents.find(
    (event) => typeof event === 'object' && event !== null && event.status === 'active',
  ) as SaleEvent | undefined

  const showCountdown = Boolean(activeSaleEvent?.endsAt)

  React.useEffect(() => {
    // Debug sale offer + sale event wiring
    // eslint-disable-next-line no-console
    console.log('[SaleOffer] product', {
      productId: linkedProduct.id,
      slug: linkedProduct.slug,
      saleEvents,
      activeSaleEvent,
      showCountdown,
    })
  }, [linkedProduct.id, linkedProduct.slug, saleEvents, activeSaleEvent, showCountdown])

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

  let basePrice = linkedProduct.priceInUSD

  if (linkedProduct.enableVariants && linkedProduct?.variants?.docs?.length) {
    basePrice = linkedProduct?.variants?.docs?.reduce((acc, variant) => {
      if (typeof variant === 'object' && variant?.priceInUSD && acc && variant?.priceInUSD > acc) {
        return variant.priceInUSD
      }
      return acc
    }, basePrice)
  }

  let displayPrice = basePrice
  let originalPrice: number | null = null

  if (activeSaleEvent?.salePrice && typeof activeSaleEvent.salePrice === 'number') {
    originalPrice = basePrice ?? null
    displayPrice = activeSaleEvent.salePrice
  }

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

            <div className="mt-2 flex items-baseline gap-3 flex-wrap">
              {originalPrice && originalPrice !== displayPrice ? (
                <>
                  <span className="text-lg md:text-xl font-semibold text-muted-foreground line-through">
                    ${((originalPrice ?? 0) / 100).toFixed(2)}
                  </span>
                  <span className="text-2xl md:text-3xl font-bold text-primary">
                    ${((displayPrice ?? 0) / 100).toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="text-2xl md:text-3xl font-bold text-primary">
                  ${((displayPrice ?? 0) / 100).toFixed(2)}
                </span>
              )}
            </div>

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

