'use client'

import { Cart } from '@/components/Cart'
import { OpenCartButton } from '@/components/Cart/OpenCart'
import { CMSLink } from '@/components/Link'
import { Price } from '@/components/Price'
import Link from 'next/link'
import { Suspense, useEffect, useMemo, useState } from 'react'

import { Search } from '@/components/Search'
import { Header } from '@/payload-types'
import { useTheme } from '@/providers/Theme'
import { cn } from '@/utilities/cn'
import { ChevronDown, Heart, Menu as MenuIcon, Phone, User } from 'lucide-react'
import { usePathname } from 'next/navigation'

import { MobileMenu } from './MobileMenu'

type Props = {
  header: Header
}

export function HeaderClient({ header }: Props) {
  const { navItems = [], categories = [], topBarContent, contactNumber } = header
  const pathname = usePathname()
  const [isSticky, setIsSticky] = useState(false)
  const [showCategories, setShowCategories] = useState(false)
  const { theme = 'light', setTheme } = useTheme()

  const themeLabel = useMemo(() => {
    if (theme === 'light') return 'Light'
    if (theme === 'dark') return 'Dark'
    return 'Light'
  }, [theme])

  const formattedContactNumber = useMemo(() => {
    const raw = (contactNumber || '+0123456789').trim()
    const digits = raw.replace(/\D/g, '')

    if (!digits) return raw

    // Vietnam: local number starting with 0, e.g. 0388291140 -> (+84)388.291.140
    if (digits.startsWith('0') && digits.length >= 9) {
      const rest = digits.slice(1)
      const restFormatted = rest.replace(/(\d{3})(?=\d)/g, '$1.').trim()

      return `(+84)${restFormatted}`
    }

    // Vietnam: already with country code, e.g. 84388291140 -> (+84)388.291.140
    if (digits.startsWith('84') && digits.length > 2) {
      const rest = digits.slice(2)
      const restFormatted = rest.replace(/(\d{3})(?=\d)/g, '$1.').trim()

      return `(+84)${restFormatted}`
    }

    // Generic international: +CC XXXX XXXX...
    const country = digits.slice(0, 2)
    const rest = digits.slice(2)
    const restFormatted = rest.replace(/(\d{4})(?=\d)/g, '$1 ').trim()

    return `+${country}${restFormatted ? ` ${restFormatted}` : ''}`
  }, [contactNumber])

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 150)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className="w-full bg-white text-black" data-theme="light">
      {/* Top Bar */}
      <div className="bg-white border-b py-2 hidden md:block">
        <div className="container flex justify-between items-center text-sm font-light text-muted-foreground">
          <div>{topBarContent || 'Free Delivery: Take advantage of our limited time offer!'}</div>
          <div className="flex gap-6">
            <div className="relative group cursor-pointer py-1">
              <span className="flex items-center gap-1 hover:text-primary transition-colors">
                English <ChevronDown size={12} />
              </span>
              <div className="absolute top-full right-0 bg-background border shadow-lg hidden group-hover:block z-50 min-w-30 py-2">
                <div className="px-4 py-1.5 hover:bg-muted transition-colors">English</div>
                <div className="px-4 py-1.5 hover:bg-muted transition-colors">Vietnam</div>
              </div>
            </div>
            <div className="relative group cursor-pointer py-1">
              <button
                type="button"
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                Theme: {themeLabel} <ChevronDown size={12} />
              </button>
              <div className="absolute top-full right-0 bg-background border shadow-lg hidden group-hover:block z-50 min-w-30 py-2">
                <button
                  type="button"
                  className="block w-full text-left px-4 py-1.5 hover:bg-muted transition-colors"
                  onClick={() => setTheme('light')}
                >
                  Light
                </button>
                <button
                  type="button"
                  className="block w-full text-left px-4 py-1.5 hover:bg-muted transition-colors"
                  onClick={() => setTheme('dark')}
                >
                  Dark
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Header */}
      <div className="bg-white py-6 md:py-10 border-b md:border-none">
        <div className="container flex items-stretch justify-between gap-8">
          {/* Mobile Menu Button - Left on mobile */}
          <div className="md:hidden flex-1">
            <Suspense fallback={null}>
              <MobileMenu menu={navItems} />
            </Suspense>
          </div>

          {/* Logo - Center on mobile, left on desktop */}
          <Link
            href="/"
            className="shrink-0 flex-1 md:flex-none flex justify-center md:justify-start"
          >
            <h1 className="text-4xl font-bold tracking-tighter text-foreground">
              LUKANI<span className="text-primary">.</span>
            </h1>
          </Link>

          {/* Search Bar - Hidden on Mobile */}
          <div className="hidden md:flex grow max-w-2xl mx-12">
            <Search
              className="rounded-none border-2 border-primary"
              categories={categories as any}
            />
          </div>

          {/* Icons */}
          <div className="self-stretch flex items-center gap-4 md:gap-7 flex-1 md:flex-none justify-end">
            <Link href="/account" className="hidden lg:block hover:text-primary transition-colors">
              <User size={26} strokeWidth={1.5} />
            </Link>
            <Link
              href="/wishlist"
              className="hidden lg:block hover:text-primary transition-colors relative"
            >
              <Heart size={26} strokeWidth={1.5} />
              <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold">
                0
              </span>
            </Link>
            <Suspense fallback={<OpenCartButton />}>
              <Cart
                renderTrigger={({ quantity, subtotal }) => (
                  <button
                    type="button"
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <OpenCartButton quantity={quantity} />
                    <div className="hidden xl:flex flex-col text-[11px] font-bold leading-tight text-left">
                      <span className="text-muted-foreground uppercase">My Cart</span>
                      <Price
                        as="span"
                        amount={typeof subtotal === 'number' ? subtotal : 0}
                        className="text-foreground"
                      />
                    </div>
                  </button>
                )}
              />
            </Suspense>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'transition-all duration-300',
          isSticky
            ? 'fixed top-0 left-0 right-0 z-50 shadow-md translate-y-0 bg-white border-y'
            : 'relative bg-white border-y',
        )}
      >
        <div className="container flex items-center justify-between">
          {/* Categories Dropdown */}
          <div className="relative group w-64">
            <button
              className="bg-primary text-white w-full py-3 px-4 flex items-center justify-between font-medium"
              onClick={() => setShowCategories(!showCategories)}
            >
              <div className="flex items-center gap-2">
                <MenuIcon size={20} />
                <span>CATEGORIES</span>
              </div>
              <ChevronDown
                size={16}
                className={cn('transition-transform', showCategories && 'rotate-180')}
              />
            </button>

            {/* Categories Menu */}
            <div
              className={cn(
                'absolute top-full left-0 w-full bg-white border shadow-lg z-50 transition-all duration-300 origin-top',
                showCategories
                  ? 'scale-y-100 opacity-100'
                  : 'scale-y-0 opacity-0 pointer-events-none',
              )}
            >
              <ul className="py-2">
                {categories && categories.length > 0 ? (
                  categories.map((item: { link: any; id?: string | null }, i: number) => (
                    <li
                      key={item.id || i}
                      className="px-4 py-2 hover:bg-muted transition-colors border-b last:border-none border-border/50"
                    >
                      <CMSLink {...item.link} className="block w-full text-sm font-medium" />
                    </li>
                  ))
                ) : (
                  <>
                    {[
                      'Plant Stands',
                      'Outdoor Pots',
                      'Lighting',
                      'Fresh Flowers',
                      'House Plants',
                    ].map((cat) => (
                      <li
                        key={cat}
                        className="px-4 py-2 hover:bg-muted transition-colors border-b last:border-none border-border/50"
                      >
                        <Link href="/shop" className="block w-full text-sm font-medium">
                          {cat}
                        </Link>
                      </li>
                    ))}
                  </>
                )}
              </ul>
            </div>
          </div>

          {/* Main Navigation */}
          <nav className="grow ml-8">
            <ul className="flex items-center gap-8">
              {navItems &&
                navItems.map((item: { link: any; id?: string | null }, i: number) => (
                  <li key={item.id || i}>
                    <CMSLink
                      {...item.link}
                      className={cn(
                        'navLink py-4 block text-sm font-bold uppercase tracking-wider hover:text-primary transition-colors relative',
                        pathname === item.link.url && 'text-primary active',
                      )}
                    />
                  </li>
                ))}
            </ul>
          </nav>

          {/* Help / Phone */}
          <div className="self-stretch hidden md:flex items-center justify-end">
            <div className="inline-flex items-center gap-3 rounded-sm border border-border/40 bg-neutral-50/60 px-5 py-3">
              <Phone size={22} strokeWidth={1.8} className="text-primary" />
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Call us 24/7
                </span>
                <span className="mt-0.5 text-lg font-bold tracking-[0.03em] text-primary">
                  {formattedContactNumber}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
