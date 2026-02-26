'use client'

import React from 'react'

import type { Media as MediaType, SaleOfferBlock as SaleOfferBlockType } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'

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
    productLabel,
    gallery,
    title,
    description,
    originalPrice,
    price,
    currency,
    rating,
    highlight,
    countdown,
    cta,
  } = props

  const [activeIndex, setActiveIndex] = React.useState(0)

  const mainImage: MediaType | null =
    Array.isArray(gallery) && gallery[activeIndex] && gallery[activeIndex].image
      ? (gallery[activeIndex].image as unknown as MediaType)
      : null

  const showCountdown = Boolean(
    countdown?.enabled && countdown?.targetDate && typeof countdown.targetDate === 'string',
  )

  const [parts, setParts] = React.useState<CountdownParts>(() =>
    showCountdown ? getCountdownParts(new Date(countdown!.targetDate as string)) : getCountdownParts(new Date()),
  )

  React.useEffect(() => {
    if (!showCountdown || !countdown?.targetDate) return

    const target = new Date(countdown.targetDate as string)
    const id = setInterval(() => {
      setParts(getCountdownParts(target))
    }, 1000)

    return () => clearInterval(id)
  }, [countdown?.targetDate, showCountdown])

  const ctaLink = Array.isArray(cta) && cta[0]?.link ? cta[0].link : null

  const isCountdownExpired =
    showCountdown &&
    parts.days === '00' &&
    parts.hours === '00' &&
    parts.minutes === '00' &&
    parts.seconds === '00'

  const showSalePrice = showCountdown && !isCountdownExpired && typeof originalPrice === 'number'
  const displayPrice = isCountdownExpired && typeof originalPrice === 'number' ? originalPrice : price

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
        <div className="grid gap-6 md:gap-8 lg:grid-cols-2 lg:gap-12 items-start">
          {/* Left: vertical label + gallery filling full left column */}
          <div className="relative space-y-4">
            <div className="bg-muted relative aspect-4/3 w-full overflow-hidden rounded-lg flex items-center justify-center">
              {mainImage && (
                <Media resource={mainImage} imgClassName="h-full w-full object-contain" />
              )}
            </div>

            {Array.isArray(gallery) && gallery.length > 1 && (
              <div className="mt-3 flex gap-3">
                {gallery.slice(0, 4).map((item, index) => {
                  if (!item?.image) return null
                  const thumb = item.image as unknown as MediaType

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className={`relative overflow-hidden rounded-md border ${
                        index === activeIndex ? 'border-primary' : 'border-transparent'
                      }`}
                    >
                      <div className="h-20 w-20 md:h-24 md:w-24">
                        <Media resource={thumb} imgClassName="h-full w-full object-cover" />
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
            {productLabel && (
              <div className="hidden lg:block absolute left-0 top-0">
                <span
                  className="text-[40px] font-extrabold tracking-[0.3em] text-muted-foreground/40"
                  style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                >
                  {productLabel.toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Right: content, inspired by product detail layout */}
          <div className="flex flex-col space-y-4">
            {typeof rating === 'number' && rating > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5 text-yellow-500 text-sm">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i}>{i < Math.round(rating) ? '★' : '☆'}</span>
                  ))}
                </div>
                <span className="text-muted-foreground text-sm">{rating.toFixed(1)} / 5</span>
              </div>
            )}

            {title && (
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight uppercase">
                {title}
              </h2>
            )}

            {description && (
              <p className="text-muted-foreground text-sm md:text-base">
                {description}
              </p>
            )}

            <div className="mt-2 flex items-baseline gap-3 flex-wrap">
              {showSalePrice && (
                <span className="text-lg md:text-xl font-bold text-muted-foreground line-through">
                  {currency}
                  {originalPrice}
                </span>
              )}
              <span
                className={`font-bold ${showSalePrice ? 'text-3xl md:text-4xl text-primary' : 'text-2xl md:text-3xl text-foreground'}`}
              >
                {currency}
                {displayPrice}
              </span>
              {showSalePrice && (
                <span className="rounded bg-primary/15 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-primary">
                  Sale
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

            {ctaLink && (
              <div className="pt-4">
                <CMSLink
                  {...ctaLink}
                  className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white hover:bg-primary/90 transition-colors"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

