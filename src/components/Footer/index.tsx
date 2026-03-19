import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'

import { CMSLink } from '@/components/Link'
import { Logo } from '@/components/Logo/Logo'
import { Facebook, Instagram, Twitter } from 'lucide-react'

import { Footer as FooterType } from '@/payload-types'

export async function Footer() {
  const footer = (await getCachedGlobal('footer', 1)()) as FooterType
  const { sections = [], openingHours = [], brandDescription, copyrightText } = footer

  const displayBrandDescription =
    brandDescription ||
    'Our florist is a creative studio where we design and curate unique botanical arrangements for your home and special events.'
  const displayCopyrightText = copyrightText || 'HUYNH YEN. All Rights Reserved.'

  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-background border-t border-[#F0F0F2]">
      {/* Main Footer Content */}
      <div className="container px-4 md:px-8 py-10 md:py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand Info */}
          <div className="flex flex-col items-start max-w-75">
            <div className="mb-6 scale-90 origin-left lg:scale-100">
              <Logo />
            </div>
            <p className="text-[#6E6E70] leading-[1.6] text-sm font-normal">
              {displayBrandDescription}
            </p>
          </div>

          {/* Dynamic Link Columns from Payload */}
          {sections &&
            sections.map((section, i: number) => (
              <div key={i}>
                <h4 className="text-[13px] font-bold text-[#1A1A1C] mb-6 uppercase tracking-[1px]">
                  {section.title}
                </h4>
                <ul className="space-y-6">
                  {section.navItems?.map((item, j: number) => (
                    <li key={j}>
                      <CMSLink
                        {...item.link}
                        className="text-[#6E6E70] hover:text-[#1A1A1C] transition-colors text-sm font-normal"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}

          {/* Opening Hours */}
          <div>
            <h4 className="text-[13px] font-bold text-[#1A1A1C] mb-6 uppercase tracking-[1px]">
              Opening Hours
            </h4>
            <ul className="space-y-6">
              {openingHours && openingHours.length > 0 ? (
                openingHours.map((item, i: number) => (
                  <li key={i} className="flex justify-between items-center text-sm">
                    <span className="text-[#6E6E70]">{item.day}</span>
                    <span className="text-[#6E6E70]">{item.hours}</span>
                  </li>
                ))
              ) : (
                <>
                  <li className="flex justify-between items-center text-sm">
                    <span className="text-[#6E6E70]">Mon - Fri:</span>
                    <span className="text-[#6E6E70]">9:00 - 20:00</span>
                  </li>
                  <li className="flex justify-between items-center text-sm">
                    <span className="text-[#6E6E70]">Sat:</span>
                    <span className="text-[#6E6E70]">10:00 - 18:00</span>
                  </li>
                  <li className="flex justify-between items-center text-sm">
                    <span className="text-[#6E6E70]">Sun:</span>
                    <span className="text-[#6E6E70]">Closed</span>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 md:mt-12 lg:mt-16 pt-6 border-t border-[#F0F0F2] flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[#6E6E70] text-[13px] font-normal">
            &copy; {currentYear} {displayCopyrightText}
          </p>
          <div className="flex items-center gap-5">
            <Link
              href="#"
              className="text-[#1A1A1C] hover:text-[#6E6E70] transition-colors"
              aria-label="Instagram"
            >
              <Instagram size={18} />
            </Link>
            <Link
              href="#"
              className="text-[#1A1A1C] hover:text-[#6E6E70] transition-colors"
              aria-label="Facebook"
            >
              <Facebook size={18} />
            </Link>
            <Link
              href="#"
              className="text-[#1A1A1C] hover:text-[#6E6E70] transition-colors"
              aria-label="Twitter"
            >
              <Twitter size={18} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

