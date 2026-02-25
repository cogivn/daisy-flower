'use client'
'use client'

import { useHeaderTheme } from '@/providers/HeaderTheme'
import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect, useMemo, useState } from 'react'

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
        ? media
            .map((item) => {
              if (
                item &&
                typeof item === 'object' &&
                'image' in item &&
                item.image &&
                typeof item.image === 'object'
              ) {
                return item.image
              }
              return null
            })
            .filter(Boolean)
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

  const primaryLink = Array.isArray(links) ? links[0] : undefined

  return (
    <section
      className="relative -mt-[10.4rem] text-foreground overflow-hidden"
    >
      {/* Background image */}
      <div className="absolute inset-0 -z-20">
        {slides.map((slide, index) => {
          if (!slide) return null

          return (
            <div
              key={typeof slide === 'object' && 'id' in slide && slide.id ? slide.id : index}
              className={`absolute inset-0 transition-opacity duration-700 ${
                index === currentIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Media
                fill
                priority={index === currentIndex}
                resource={slide}
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
            {/* Heading + paragraph from richText, styled like slider_content */}
            {richText && (
              <RichText
                className="[&_h1]:text-4xl [&_h1]:md:text-5xl [&_h1]:font-extrabold [&_h1]:tracking-tight [&_h1]:uppercase [&_p]:mt-4 [&_p]:text-base md:[&_p]:text-lg [&_p]:text-muted-foreground"
                data={richText}
                enableGutter={false}
              />
            )}

            {primaryLink && (
              <div className="pt-2">
                <CMSLink
                  {...primaryLink.link}
                  className="inline-flex items-center justify-center px-8 py-3 text-xs font-bold uppercase tracking-widest bg-primary text-white hover:bg-white hover:text-primary transition-colors"
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
