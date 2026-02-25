'use client'
import React from 'react'

import type { Media as MediaType, Page, Product } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import { RichText } from '@/components/RichText'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowUpRight, Star } from 'lucide-react'

// Defining local types for the new fields
type HeroProps = Page['hero'] & {
  brandInfo?: {
    name?: string | null
    rating?: number | null
  }
  featuredProduct?: {
    product?: number | Product | null
    stats?: { label?: string | null; value?: string | null; id?: string | null }[] | null
  }
  mediaCarousel?: { media: MediaType; id?: string | null }[] | null
  featuredText?: string | null
}

export const MediumImpactHero: React.FC<HeroProps> = (props) => {
  const { links, media, richText, brandInfo, featuredProduct, mediaCarousel, featuredText } = props

  const [activeIndex, setActiveIndex] = React.useState(0)
  const itemsCount = mediaCarousel?.length || 0

  const scrollPrev = React.useCallback(() => {
    setActiveIndex((current) => (current === 0 ? itemsCount - 1 : current - 1))
  }, [itemsCount])

  const scrollNext = React.useCallback(() => {
    setActiveIndex((current) => (current === itemsCount - 1 ? 0 : current + 1))
  }, [itemsCount])

  const product =
    featuredProduct?.product && typeof featuredProduct.product === 'object'
      ? (featuredProduct.product as Product)
      : null

  return (
    <section className="relative w-full py-12 lg:py-24 overflow-hidden bg-[#FDFBF7]">
      {/* Grid Pattern Background */}
      <div
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      <div className="container relative z-10 mx-auto px-6 lg:px-8 flex flex-col gap-10 lg:gap-14">
        {/* HEADER ROW: Headline & Brand Info */}
        <div className="grid grid-cols-12 gap-8 lg:gap-16 items-start">
          <div className="col-span-12 lg:col-span-8">
            <div className="flex flex-col gap-6">
              {featuredText && (
                <div className="inline-flex items-center self-start bg-[#E2F1E7] px-5 py-2 rounded-full border border-[#3D6E5B]/10">
                  <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#3D6E5B]">
                    {featuredText}
                  </span>
                </div>
              )}
              {richText && (
                <RichText
                  className="text-6xl lg:text-8xl font-bold tracking-tighter leading-[0.85] hero-headline text-[#1A1A1A]"
                  data={richText}
                  enableGutter={false}
                />
              )}
            </div>
          </div>
          <div className="col-span-12 lg:col-span-4 lg:pt-4">
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between bg-white px-6 py-5 rounded-[2.5rem] shadow-[0_10px_30px_rgba(0,0,0,0.03)] border border-gray-100/50">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black tracking-tight text-[#1A1A1A]">
                    {brandInfo?.name || 'Daisy'}
                  </h2>
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white transition-transform hover:rotate-45 cursor-pointer">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-[#F0F7F2] px-3 py-1.5 rounded-full border border-[#3D6E5B]/5">
                  <Star className="w-3.5 h-3.5 fill-[#3D6E5B] text-[#3D6E5B]" />
                  <span className="font-bold text-xs text-[#3D6E5B]">
                    {brandInfo?.rating || '4.8'}
                  </span>
                </div>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed px-4 italic opacity-80 font-medium">
                &quot;Discover our curated collection of artisanal flowers and lush greenery,
                designed to bring nature&apos;s beauty into every corner of your life.&quot;
              </p>
            </div>
          </div>
        </div>

        {/* VISUALS ROW: Carousel & Spotlight Card */}
        <div className="grid grid-cols-12 gap-8 lg:gap-16 items-start">
          <div className="col-span-12 lg:col-span-8">
            <div className="relative group/carousel">
              <div className="flex gap-4 h-130 w-full items-stretch">
                {mediaCarousel && mediaCarousel.length > 0
                  ? mediaCarousel.slice(0, 3).map((item, index) => {
                      const isExpanded = index === activeIndex
                      return (
                        <div
                          key={index}
                          onClick={() => setActiveIndex(index)}
                          className={`relative cursor-pointer transition-all duration-700 ease-in-out overflow-hidden shadow-2xl border-2 border-white ${
                            isExpanded ? 'flex-4 rounded-[4rem]' : 'flex-1 rounded-[3rem]'
                          }`}
                        >
                          <Media
                            resource={item.media}
                            className="w-full h-full"
                            imgClassName="object-cover w-full h-full transition-transform duration-1000 lg:group-hover:scale-110"
                            priority={index === 0}
                          />
                          {!isExpanded && (
                            <div className="absolute inset-0 bg-black/10 hover:bg-transparent transition-colors duration-500" />
                          )}
                        </div>
                      )
                    })
                  : media &&
                    typeof media === 'object' && (
                      <div className="w-full h-full rounded-[4rem] overflow-hidden shadow-2xl border-4 border-white">
                        <Media
                          resource={media}
                          className="w-full h-full"
                          imgClassName="object-cover w-full h-full"
                          priority
                        />
                      </div>
                    )}
              </div>

              {/* Carousel Navigation */}
              {mediaCarousel && mediaCarousel.length > 1 && (
                <div className="absolute top-1/2 -translate-y-1/2 -left-5 -right-5 flex justify-between pointer-events-none opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 z-30">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      scrollPrev()
                    }}
                    variant="secondary"
                    size="icon"
                    className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-md pointer-events-auto shadow-lg hover:bg-black hover:text-white transition-all transform hover:scale-110 active:scale-95"
                  >
                    <span className="text-sm">←</span>
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      scrollNext()
                    }}
                    variant="secondary"
                    size="icon"
                    className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-md pointer-events-auto shadow-lg hover:bg-black hover:text-white transition-all transform hover:scale-110 active:scale-95"
                  >
                    <span className="text-sm">→</span>
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 flex flex-col gap-10">
            {product && (
              <Card className="rounded-[4rem] overflow-hidden border-none shadow-[0_40px_80px_rgba(0,0,0,0.06)] bg-white group relative">
                <div className="aspect-square overflow-hidden relative">
                  {product.gallery?.[0]?.image && typeof product.gallery[0].image === 'object' && (
                    <Media
                      resource={product.gallery[0].image}
                      className="w-full h-full transition-transform duration-1000 lg:group-hover:scale-110"
                      imgClassName="object-cover w-full h-full"
                    />
                  )}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="rounded-full bg-white/80 backdrop-blur-md shadow-sm w-10 h-10 hover:bg-black hover:text-white transition-colors"
                    >
                      <span className="text-sm">←</span>
                    </Button>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="rounded-full bg-white/80 backdrop-blur-md shadow-sm w-10 h-10 hover:bg-black hover:text-white transition-colors"
                    >
                      <span className="text-sm">→</span>
                    </Button>
                  </div>
                </div>
                <div className="p-8 pb-10">
                  <div className="flex flex-wrap gap-5 mb-8">
                    {featuredProduct?.stats?.slice(0, 2).map((stat, i) => (
                      <div
                        key={i}
                        className="flex flex-col gap-0.5 border-l-2 border-[#E2F1E7] pl-4"
                      >
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">
                          {stat.label}
                        </span>
                        <span className="text-sm font-bold text-[#1A1A1A]">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                    <div className="flex flex-col">
                      <h3 className="text-2xl font-black text-[#1A1A1A] tracking-tight">
                        {product.title}
                      </h3>
                      <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                        Standard Size
                      </span>
                    </div>
                    <Button
                      size="default"
                      className="rounded-full bg-[#1A1A1A] hover:bg-black px-7 text-xs h-12 shrink-0 font-bold"
                    >
                      Shop Now
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            <div className="flex items-center gap-4 px-2 text-center">
              {Array.isArray(links) &&
                links.map(({ link }, i) => (
                  <CMSLink
                    key={i}
                    {...link}
                    className={`py-4 px-8 rounded-full font-bold transition-all text-sm grow ${
                      i === 0
                        ? 'bg-black text-white hover:shadow-2xl hover:-translate-y-1'
                        : 'bg-transparent border border-gray-200 hover:bg-gray-50'
                    }`}
                  />
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Global Style for Highlighted Headline Parts */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .hero-headline strong {
          position: relative;
          color: inherit;
          font-weight: inherit;
          z-index: 1;
        }
        .hero-headline strong::after {
          content: '';
          position: absolute;
          bottom: 15%;
          left: -0.05em;
          right: -0.05em;
          height: 0.25em;
          background-color: #E2F1E7;
          z-index: -1;
          border-radius: 99px;
          opacity: 0.8;
        }
      `,
        }}
      />
    </section>
  )
}
