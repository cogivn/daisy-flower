import type { BlogBentoBlock as BlogBentoBlockType, Media } from '@/payload-types'

import React from 'react'
import Link from 'next/link'

import { CMSLink } from '@/components/Link'
import { Media as MediaComponent } from '@/components/Media'
import { BentoGrid } from '@/components/ui/bento-grid'
import { BentoItem, BentoDescription, BentoTitle } from '@/components/ui/bento'
import { cn } from '@/utilities/cn'

type BlogItem = NonNullable<BlogBentoBlockType['items']>[number]

type Props = BlogBentoBlockType

export const BlogBentoBlock: React.FC<Props> = ({
  eyebrow,
  heading,
  description,
  seeMoreLink,
  items,
}) => {
  if (!items || items.length === 0) return null

  // Use first 5 items in a fixed bento layout:
  // Row 1–2: large card (2 cols, 2 rows) + two stacked small cards on the right
  // Row 3: small card on the left + wide card across the remaining 2 cols
  const typedItems = (items || []) as BlogItem[]
  const cards = typedItems.slice(0, 5)

  const getHrefAndCta = (item: BlogItem): { href: string; cta: string } => {
    const href = item.link?.url || '#'
    const cta = item.link?.label || 'Read story'
    return { href, cta }
  }

  const renderImage = (item: BlogItem, variant: 'hero' | 'small' = 'small') => {
    const baseClasses =
      variant === 'hero'
        ? 'w-full overflow-hidden bg-muted'
        : 'w-full overflow-hidden bg-muted h-40 md:h-48'

    if (!item.image || typeof item.image !== 'object') {
      return <div className={baseClasses} />
    }

    return (
      <div className={baseClasses}>
        <MediaComponent
          resource={item.image as Media}
          className="h-full w-full object-cover object-center"
        />
      </div>
    )
  }

  const layoutClasses = [
    // Card 1: big hero (2 cols, 2 rows)
    'lg:col-span-2 lg:row-span-2',
    // Card 2: top-right
    'lg:col-span-1 lg:row-span-1',
    // Card 3: middle-right
    'lg:col-span-1 lg:row-span-1',
    // Card 4: bottom-left
    'lg:col-span-1 lg:row-span-1',
    // Card 5: bottom-wide
    'lg:col-span-2 lg:row-span-1',
  ]

  return (
    <section className="bg-white section-spacing debug-outline debug-grid">
      <div className="container space-y-4 md:space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xl space-y-2">
            {eyebrow && (
              <p className="text-xs md:text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                {eyebrow}
              </p>
            )}
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight uppercase text-foreground">
              {heading}
            </h2>
            {description && (
              <p className="text-sm md:text-base text-muted-foreground">{description}</p>
            )}
          </div>

          {seeMoreLink && (seeMoreLink.url || seeMoreLink.reference) && (
            <div className="shrink-0">
              <CMSLink
                {...seeMoreLink}
                label={seeMoreLink.label || 'See more'}
                appearance="default"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-8 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white hover:bg-primary/90 transition-colors"
              />
            </div>
          )}
        </div>

        <div className="mt-6 sm:mt-8">
          <BentoGrid className="w-full auto-rows-auto lg:auto-rows-auto">
            {cards.map((item, index) => {
              const { href, cta } = getHrefAndCta(item)
              const layoutClass = layoutClasses[index] || 'lg:col-span-1'
              const isHero = index === 0

              return (
                <BentoItem
                  key={item.id || item.title || index}
                  className={cn(
                    'rounded-none',
                    isHero && 'lg:col-span-2 lg:row-span-2',
                    layoutClass,
                  )}
                >
                  <Link href={href} className="block">
                    {renderImage(item, isHero ? 'hero' : 'small')}
                  </Link>
                  <div className="flex flex-col gap-3 p-4">
                    <div className="space-y-1.5">
                      {item.kicker && (
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                          {item.kicker}
                        </p>
                      )}
                      <BentoTitle>
                        <span className="line-clamp-2 text-sm md:text-base">{item.title}</span>
                      </BentoTitle>
                      {item.excerpt && (
                        <BentoDescription>
                          <span className="line-clamp-3 text-xs md:text-sm">{item.excerpt}</span>
                        </BentoDescription>
                      )}
                    </div>
                    <Link
                      href={href}
                      className="text-xs font-semibold uppercase tracking-[0.18em] text-primary underline-offset-2 hover:underline"
                    >
                      {cta}
                    </Link>
                  </div>
                </BentoItem>
              )
            })}
          </BentoGrid>
        </div>
      </div>
    </section>
  )
}

