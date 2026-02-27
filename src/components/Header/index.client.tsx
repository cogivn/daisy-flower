'use client'

import { Cart } from '@/components/Cart'
import { OpenCartButton } from '@/components/Cart/OpenCart'
import { CMSLink } from '@/components/Link'
import { Price } from '@/components/Price'
import Link from 'next/link'
import { Suspense, useEffect, useMemo, useState } from 'react'

import { Category, Header } from '@/payload-types'
import { useTheme } from '@/providers/Theme'
import { cn } from '@/utilities/cn'
import { ChevronDown, Heart, Menu as MenuIcon, Phone, User } from 'lucide-react'
import { usePathname } from 'next/navigation'

import { MobileMenu } from '@/components/Header/MobileMenu'
import { Search } from '@/components/layout/search/Search'

type Props = {
  header: Header
  categories: Category[]
}

export function HeaderClient({ header, categories }: Props) {
  const { navItems = [], topBarContent, contactNumber } = header
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
    <header className="relative z-50 w-full bg-white text-black" data-theme="light">
      {/* Top Bar */}
      <div className="bg-white border-b py-2 hidden md:block debug-outline debug-grid">
        <div className="container debug-container flex justify-between items-center text-sm font-light text-muted-foreground">
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

      {/* Middle Header - higher z so search dropdown can overlap nav bar */}
      <div className="relative z-60 bg-white py-6 md:py-10 border-b md:border-none debug-outline debug-grid">
        <div className="container debug-container flex items-stretch justify-between gap-4 md:gap-8">
          {/* Mobile Menu Button - Left on mobile; z-10 + min size so tap always hits */}
          <div className="md:hidden flex-1 min-w-0 flex items-center shrink-0 relative z-10">
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
              categories={categories}
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

      {/* Categories bar: overflow-visible so dropdown can overlap content below */}
      <div
        className={cn(
          'relative z-50 transition-all duration-300 overflow-visible py-1 md:py-2',
          isSticky
            ? 'fixed top-0 left-0 right-0 shadow-md translate-y-0 bg-white border-y'
            : 'bg-white border-y',
        )}
      >
        <div className="container debug-container flex flex-row items-center justify-between gap-2 md:gap-0">
          {/* Categories Dropdown - full width on mobile, fixed width on desktop */}
          <div className="relative w-full md:w-64 md:shrink-0">
            <button
              type="button"
              className="bg-primary text-white w-full py-3 px-3 md:px-4 flex items-center justify-between font-medium text-left touch-manipulation cursor-pointer select-none"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowCategories((prev) => !prev)
              }}
              aria-expanded={showCategories}
              aria-haspopup="true"
            >
              <div className="flex items-center gap-2 min-w-0">
                <MenuIcon size={20} className="shrink-0" />
                <span className="truncate">Categories</span>
              </div>
              <ChevronDown
                size={16}
                className={cn('shrink-0 transition-transform', showCategories && 'rotate-180')}
              />
            </button>

            {/* Categories Menu - use max-height so it's not clipped by scale-y-0 on mobile */}
            <div
              className={cn(
                'absolute top-full left-0 w-full md:w-full bg-white border shadow-lg z-100 transition-all duration-200 origin-top overflow-y-auto',
                showCategories
                  ? 'max-h-[60vh] md:max-h-[70vh] opacity-100 visible'
                  : 'max-h-0 opacity-0 invisible pointer-events-none border-transparent',
              )}
              style={showCategories ? undefined : { overflow: 'hidden' }}
            >
              <ul className="py-2">
                {categories && categories.length > 0 ? (
                  categories.map((cat) => (
                    <li
                      key={cat.id}
                      className="px-4 py-2 hover:bg-muted transition-colors border-b last:border-none border-border/50"
                    >
                      <Link
                        href={`/shop?category=${cat.slug ?? ''}`}
                        className="block w-full text-sm font-medium"
                      >
                        {cat.title}
                      </Link>
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

          {/* Main Navigation - hidden on mobile (links are in MobileMenu), visible on desktop */}
          <nav className="hidden md:block grow md:ml-6 lg:ml-8">
            <ul className="flex items-center gap-4 lg:gap-8 whitespace-nowrap py-2 md:py-0">
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

          {/* Help / Phone - compact padding */}
          <div className="hidden md:flex items-center justify-end">
            <div className="inline-flex items-center gap-2 px-3 py-1.5">
              <Phone size={18} strokeWidth={1.8} className="text-primary shrink-0" />
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Call us 24/7
                </span>
                <span className="mt-0.5 text-sm font-bold tracking-[0.03em] text-primary">
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
