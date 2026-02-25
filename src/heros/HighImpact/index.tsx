'use client'
'use client'

import { useHeaderTheme } from '@/providers/HeaderTheme'
import { AnimatePresence, motion } from 'framer-motion'
import React, { type ComponentProps, useEffect, useMemo, useState } from 'react'

import type { Page } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import { RichText } from '@/components/RichText'

export const HighImpactHero: React.FC<Page['hero']> = ({ links, media, richText }) => {
  const { setHeaderTheme } = useHeaderTheme()

  useEffect(() => {
    setHeaderTheme('light')
  }, [setHeaderTheme])

  const slides = useMemo(
    () =>
      Array.isArray(media)
        ? media.filter(
            (item) =>
              item &&
              typeof item === 'object' &&
              'image' in item &&
              item.image &&
              typeof item.image === 'object',
          )
        : [],
    [media],
  )

  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (!slides.length) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [slides.length])

  type CMSLinkProps = ComponentProps<typeof CMSLink>

  const primaryLink = Array.isArray(links) ? links[0] : undefined

  const currentSlide: any = slides[currentIndex] || null
  const slideFeatured: string | undefined = currentSlide?.featured
  const slideTitle: string | undefined = currentSlide?.title
  const slideDescription: string | undefined = currentSlide?.description

  const slideButtonRow = Array.isArray(currentSlide?.button)
    ? currentSlide.button[0]
    : undefined
  const slideButtonLink: CMSLinkProps | null =
    slideButtonRow?.link && typeof slideButtonRow.link === 'object'
      ? (slideButtonRow.link as CMSLinkProps)
      : null

  const getButtonClasses = (appearance?: CMSLinkProps['appearance']) => {
    const base =
      'inline-flex items-center justify-center px-8 py-3 text-xs font-bold uppercase tracking-widest transition-colors'

    if (appearance === 'outline') {
      return `${base} border border-primary text-primary bg-transparent hover:bg-primary hover:text-white`
    }

    return `${base} bg-primary text-white hover:bg-white hover:text-primary`
  }

  return (
    <section
      className="relative -mt-[10.4rem] text-foreground overflow-hidden"
    >
      {/* Background image */}
      <div className="absolute inset-0 -z-20">
        {slides.map((slide: any, index) => {
          if (!slide || !slide.image) return null
          const image = slide.image

          return (
            <div
              key={typeof image === 'object' && 'id' in image && image.id ? image.id : index}
              className={`absolute inset-0 transition-opacity duration-700 ${
                index === currentIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Media
                fill
                priority={index === currentIndex}
                resource={image}
                imgClassName="w-full h-full object-cover"
              />
            </div>
          )
        })}
      </div>
      {/* Content overlay */}
      <div className="container min-h-[70vh] flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="max-w-xl space-y-4 md:space-y-6"
          >
            {/* Slide-specific content (featured + title + description), fallback to shared richText */}
            {slideFeatured || slideTitle || slideDescription ? (
              <div className="space-y-4 md:space-y-5">
                {slideFeatured && (
                  <div className="inline-flex items-center self-start bg-primary/5 px-4 py-1.5 rounded-full border border-primary/20">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
                      {slideFeatured}
                    </span>
                  </div>
                )}
                {slideTitle && (
                  <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight uppercase">
                    {slideTitle}
                  </h1>
                )}
                {slideDescription && (
                  <p className="text-base md:text-lg text-muted-foreground">
                    {slideDescription}
                  </p>
                )}
              </div>
            ) : (
              richText && (
                <RichText
                  className="[&_h1]:text-4xl [&_h1]:md:text-5xl [&_h1]:font-extrabold [&_h1]:tracking-tight [&_h1]:uppercase [&_p]:mt-4 [&_p]:text-base md:[&_p]:text-lg [&_p]:text-muted-foreground"
                  data={richText}
                  enableGutter={false}
                />
              )
            )}

            {/* Slide-specific button (optional), fallback to primary hero link */}
            {(slideButtonLink || primaryLink) && (
              <div className="pt-2">
                {slideButtonLink ? (
                  <CMSLink
                    {...slideButtonLink}
                    className={getButtonClasses(slideButtonLink.appearance)}
                  />
                ) : primaryLink ? (
                  <CMSLink
                    {...primaryLink.link}
                    className={getButtonClasses(primaryLink.link?.appearance)}
                  />
                ) : null}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
