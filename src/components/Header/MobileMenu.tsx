'use client'

import type { Header } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useAuth } from '@/providers/Auth'
import { useTheme } from '@/providers/Theme'
import { MenuIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'

interface Props {
  menu: Header['navItems']
}

export function MobileMenu({ menu }: Props) {
  const { user } = useAuth()
  const { theme = 'light', setTheme } = useTheme()

  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)

  const closeMobileMenu = () => setIsOpen(false)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isOpen])

  useEffect(() => {
    setIsOpen(false)
  }, [pathname, searchParams])

  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      <SheetTrigger
        type="button"
        className="relative flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-md border border-neutral-200 text-black transition-colors touch-manipulation active:scale-95 dark:border-neutral-700 dark:bg-black dark:text-white"
      >
        <MenuIcon className="h-5 w-5" aria-hidden />
      </SheetTrigger>

      <SheetContent side="left" className="px-4 text-base font-normal">
        <SheetHeader className="px-0 pt-4 pb-0">
          <SheetTitle className="text-base font-semibold">My Store</SheetTitle>

          <SheetDescription />
        </SheetHeader>

        <div className="py-4">
          {menu?.length ? (
            <ul className="flex w-full flex-col gap-0">
              {menu.map((item) => (
                <li className="py-2" key={item.id}>
                  <CMSLink {...item.link} appearance="link" className="text-base font-normal" />
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {user ? (
          <div className="mt-4">
            <h2 className="text-base font-semibold mb-4">My account</h2>
            <hr className="my-2" />
            <ul className="flex flex-col gap-2">
              <li>
                <Link href="/orders" className="text-base font-normal">
                  Orders
                </Link>
              </li>
              <li>
                <Link href="/account/addresses" className="text-base font-normal">
                  Addresses
                </Link>
              </li>
              <li>
                <Link href="/account" className="text-base font-normal">
                  Manage account
                </Link>
              </li>
              <li className="mt-6">
                <Button asChild variant="outline" className="text-base font-normal">
                  <Link href="/logout">Log out</Link>
                </Button>
              </li>
            </ul>
          </div>
        ) : (
          <div>
            <h2 className="text-base font-semibold mb-4">My account</h2>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button asChild className="w-full sm:flex-1 text-base font-normal" variant="outline">
                <Link href="/login">Log in</Link>
              </Button>
              <span className="text-center text-base text-muted-foreground">or</span>
              <Button asChild className="w-full sm:flex-1 text-base font-normal">
                <Link href="/create-account">Create an account</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Theme switcher at bottom - for responsive (mobile) */}
        <div className="mt-auto pt-4 border-t border-border">
          <p className="text-base font-semibold text-muted-foreground mb-2">Theme</p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={theme === 'light' ? 'default' : 'outline'}
              size="sm"
              className="flex-1 text-base font-normal"
              onClick={() => setTheme('light')}
            >
              Light
            </Button>
            <Button
              type="button"
              variant={theme === 'dark' ? 'default' : 'outline'}
              size="sm"
              className="flex-1 text-base font-normal"
              onClick={() => setTheme('dark')}
            >
              Dark
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
