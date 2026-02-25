'use client'
import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import { Media as MediaType } from '@/payload-types'
import useEmblaCarousel from 'embla-carousel-react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import React from 'react'

export type Slide = {
  title: string
  subtitle?: string | null
  description?: string | null
  media: number | MediaType
  link?: any
  id?: string | null
}

export const HomeSlider: React.FC<{ slides?: Slide[] | null }> = ({ slides }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })

  if (!slides || slides.length === 0) return null

  return (
    <div className="relative overflow-hidden group" ref={emblaRef}>
      <div className="flex">
        {slides.map((slide: Slide, i: number) => (
          <div key={i} className="flex-[0_0_100%] min-w-0 relative h-125 md:h-175">
            {/* Background Image */}
            {slide.media && (
              <Media
                resource={slide.media}
                fill
                imgClassName="object-cover -z-10"
                priority={i === 0}
              />
            )}
            {/* Content Overlay */}
            <div className="container h-full flex flex-col justify-center items-start relative z-10">
              <div className="max-w-xl">
                {slide.subtitle && (
                  <span className="text-primary font-bold tracking-[0.2em] uppercase mb-4 block animate-in fade-in slide-in-from-bottom duration-700 delay-300 fill-mode-both">
                    {slide.subtitle}
                  </span>
                )}
                <h2 className="text-4xl md:text-7xl font-black mb-6 tracking-tight leading-[1.1] text-foreground animate-in fade-in slide-in-from-bottom duration-700 delay-500 fill-mode-both">
                  {slide.title}
                </h2>
                {slide.description && (
                  <p className="text-lg mb-10 text-neutral-600 leading-relaxed max-w-md animate-in fade-in slide-in-from-bottom duration-700 delay-700 fill-mode-both">
                    {slide.description}
                  </p>
                )}
                {slide.link && (
                  <div className="animate-in fade-in slide-in-from-bottom duration-700 delay-1000 fill-mode-both">
                    <CMSLink
                      {...slide.link}
                      className="px-10 py-4 bg-primary text-white font-bold hover:bg-foreground transition-all duration-300 inline-block uppercase tracking-wider text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={() => emblaApi?.scrollPrev()}
        className="absolute left-8 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full border border-primary/30 items-center justify-center hover:bg-primary hover:text-white transition-all text-primary bg-white/10 backdrop-blur-md opacity-0 group-hover:opacity-100 hidden md:flex"
      >
        <ArrowLeft size={24} />
      </button>
      <button
        onClick={() => emblaApi?.scrollNext()}
        className="absolute right-8 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full border border-primary/30 items-center justify-center hover:bg-primary hover:text-white transition-all text-primary bg-white/10 backdrop-blur-md opacity-0 group-hover:opacity-100 hidden md:flex"
      >
        <ArrowRight size={24} />
      </button>

      {/* Dots Indicator could go here */}
    </div>
  )
}
