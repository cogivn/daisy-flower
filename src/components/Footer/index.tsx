import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'

import { CMSLink } from '@/components/Link'
import { Facebook, Instagram, MapPin, Phone, Twitter, Youtube } from 'lucide-react'

import { Footer as FooterType } from '@/payload-types'

export async function Footer() {
  const footer = (await getCachedGlobal('footer', 1)()) as FooterType
  const { sections = [], openingHours = [] } = footer

  // Extract contactNumber if it exists in your schema,
  // or use a default if it's not in the generated type yet
  const contactNumber = (footer as any).contactNumber
  const brandDescription =
    (footer as any).brandDescription ||
    'We are a team of designers and developers that create high quality plants and flower shop themes for your business.'
  const copyrightText =
    (footer as any).copyrightText || 'LUKANI. Made with ❤️ for plants.'

  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white text-sm border-t">
      {/* Main Footer Content */}
      <div className="container py-20 md:py-28">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
          {/* Brand Info */}
          <div className="flex flex-col items-start">
            <Link href="/" className="inline-block mb-8">
              <h2 className="text-4xl font-bold tracking-tighter">
                LUKANI<span className="text-primary">.</span>
              </h2>
            </Link>
            <p className="text-muted-foreground leading-relaxed mb-8 text-base">
              {brandDescription}
            </p>
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <MapPin size={22} className="text-primary shrink-0 mt-1" />
                <span className="text-base text-muted-foreground">
                  1234 Street Name, City, United States
                </span>
              </div>
              <div className="flex items-start gap-4">
                <Phone size={22} className="text-primary shrink-0 mt-1" />
                <span className="text-base text-muted-foreground font-medium">
                  {contactNumber || '+01 23456789'}
                </span>
              </div>
            </div>
          </div>

          {/* Link Columns */}
          {sections &&
            sections.map((section, i: number) => (
              <div key={i}>
                <h4 className="text-lg font-bold mb-10 uppercase tracking-widest relative pb-4 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-0.5 after:bg-primary">
                  {section.title}
                </h4>
                <ul className="space-y-5">
                  {section.navItems?.map((item, j: number) => (
                    <li key={j}>
                      <CMSLink
                        {...item.link}
                        className="text-muted-foreground hover:text-primary transition-colors text-base"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}

          {/* Opening Hours */}
          <div>
            <h4 className="text-lg font-bold mb-10 uppercase tracking-widest relative pb-4 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-0.5 after:bg-primary">
              Opening Hours
            </h4>
            <ul className="space-y-5">
              {openingHours && openingHours.length > 0 ? (
                openingHours.map((item, i: number) => (
                  <li
                    key={i}
                    className="flex justify-between border-b border-border/40 pb-3 text-base"
                  >
                    <span className="text-muted-foreground">{item.day}</span>
                    <span className="font-bold text-foreground">{item.hours}</span>
                  </li>
                ))
              ) : (
                <>
                  <li className="flex justify-between border-b border-border/40 pb-3 text-base">
                    <span className="text-muted-foreground">Mon - Fri:</span>
                    <span className="font-bold text-foreground">9:00 AM - 6:00 PM</span>
                  </li>
                  <li className="flex justify-between border-b border-border/40 pb-3 text-base">
                    <span className="text-muted-foreground">Saturday:</span>
                    <span className="font-bold text-foreground">10:00 AM - 5:00 PM</span>
                  </li>
                  <li className="flex justify-between border-b border-border/40 pb-3 text-base">
                    <span className="text-muted-foreground">Sunday:</span>
                    <span className="font-bold text-foreground">Closed</span>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="bg-neutral-50 border-t items-center py-10">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-8">
          <p className="text-muted-foreground text-base">
            &copy; {currentYear}{' '}
            {copyrightText ? (
              copyrightText
            ) : (
              <>
                <strong>LUKANI</strong>. Made with ❤️ for plants.
              </>
            )}
          </p>
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="flex gap-6">
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook size={20} />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter size={20} />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram size={20} />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Youtube size={20} />
              </Link>
            </div>
            {/* Payment Icons Placeholder */}
            <div className="flex gap-3 opacity-60">
              <div className="w-12 h-8 bg-white border border-border shadow-sm flex items-center justify-center font-bold text-[8px]">
                VISA
              </div>
              <div className="w-12 h-8 bg-white border border-border shadow-sm flex items-center justify-center font-bold text-[8px]">
                PAYPAL
              </div>
              <div className="w-12 h-8 bg-white border border-border shadow-sm flex items-center justify-center font-bold text-[8px]">
                MC
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
