'use client'

import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/Auth'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import Link from 'next/link'
import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { CheckoutAddresses } from '@/components/checkout/CheckoutAddresses'
import { GuestCheckoutAddresses } from '@/components/checkout/GuestCheckoutAddresses'
import { PriceBreakdown } from '@/components/checkout/PriceBreakdown'
import { VoucherInput } from '@/components/checkout/VoucherInput'
import { CheckoutForm } from '@/components/forms/CheckoutForm'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Address, Cart } from '@/payload-types'
import {
  useAddresses,
  useCart,
  useEcommerce,
  usePayments,
} from '@payloadcms/plugin-ecommerce/client/react'
import { toast } from 'sonner'
import { cn } from '@/utilities/cn'
import { Lock, Truck, CreditCard, Calendar as CalendarIcon, Timer, Package } from 'lucide-react'
import { QRCodeIcon } from '@/components/icons/QRCode'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'

const apiKey = `${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}`
const stripe = loadStripe(apiKey)

type LevelInfo = {
  name: string
  discountPercent: number
}

type CheckoutPageProps = {
  salePrices?: Record<string, number>
  levels?: Array<{ level: string; discountPercent: number }>
  taxMode?: string
  pickupLocation?: string
  shippingDefaultFee?: number
  freeShippingThreshold?: number
}

type GuestAddress = Partial<Address> & { __guestId: string }

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  salePrices = {},
  levels = [],
  taxMode = 'exclusive',
  pickupLocation = 'Daisy Flower Main Store - 123 Le Loi Street, District 1, Ho Chi Minh City',
  shippingDefaultFee = 30000,
  freeShippingThreshold = 500000,
}) => {
  const { user } = useAuth()
  const router = useRouter()
  const { cart, clearCart } = useCart()
  const { clearSession } = useEcommerce()

  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [giftMessage, setGiftMessage] = useState('')
  const [orderNotes, setOrderNotes] = useState('')
  const didPrefillFromUserRef = useRef(false)
  const didPrefillPhoneFromUserRef = useRef(false)
  const lastSavedPhoneRef = useRef<string>('')
  const lastSavedNameRef = useRef<string>('')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'payos' | 'stripe' | 'cod'>(
    'payos',
  )
  const [pickupDate, setPickupDate] = useState<Date | undefined>(new Date())
  const [pickupTime, setPickupTime] = useState<string>('10:30 AM')

  const nameParts = React.useMemo(() => {
    const parts = fullName.trim().split(/\s+/).filter(Boolean)
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || '',
    }
  }, [fullName])

  const pickupTimeOptions = React.useMemo(() => {
    // Simple 30-minute slots, 9:00 AM -> 7:00 PM
    const times: string[] = []
    const startHour = 9
    const endHour = 19
    for (let hour = startHour; hour <= endHour; hour++) {
      for (const minute of [0, 30]) {
        if (hour === endHour && minute > 0) continue
        const period = hour >= 12 ? 'PM' : 'AM'
        const hour12 = ((hour + 11) % 12) + 1
        const mm = minute === 0 ? '00' : '30'
        times.push(`${hour12}:${mm} ${period}`)
      }
    }
    return times
  }, [])

  const availablePickupTimeOptions = React.useMemo(() => {
    const selected = pickupDate ?? new Date()
    const now = new Date()

    const startOfSelected = new Date(selected)
    startOfSelected.setHours(0, 0, 0, 0)
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)

    // Future dates: all slots valid.
    if (startOfSelected.getTime() > startOfToday.getTime()) return pickupTimeOptions

    // Past dates: none valid.
    if (startOfSelected.getTime() < startOfToday.getTime()) return []

    const toMinutes = (time: string) => {
      const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
      if (!match) return -1
      const h = Number(match[1])
      const m = Number(match[2])
      const period = match[3].toUpperCase()
      const hour24 = (h % 12) + (period === 'PM' ? 12 : 0)
      return hour24 * 60 + m
    }

    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    const cutoff = Math.ceil((nowMinutes + 1) / 30) * 30 // strictly future

    return pickupTimeOptions.filter((t) => {
      const mins = toMinutes(t)
      return mins >= 0 && mins >= cutoff
    })
  }, [pickupDate, pickupTimeOptions])

  const [paymentData, setPaymentData] = useState<null | Record<string, unknown>>(null)
  const { initiatePayment } = usePayments()
  const { addresses: rawAddresses } = useAddresses()

  const addresses = React.useMemo(() => {
    if (!rawAddresses || !user) return []
    return rawAddresses.filter((address) => {
      const customerId =
        typeof address.customer === 'object' ? address.customer?.id : address.customer
      return String(customerId) === String(user.id)
    })
  }, [rawAddresses, user])

  const [shippingAddress, setShippingAddress] = useState<Partial<Address>>()
  const [shippingMethod, setShippingMethod] = useState<'delivery' | 'pickup'>('delivery')
  const [isProcessingPayment, setProcessingPayment] = useState(false)
  const isPickupPlaceholderRef = useRef(false)

  const [guestAddresses, setGuestAddresses] = useState<GuestAddress[]>([])
  const [selectedGuestAddressId, setSelectedGuestAddressId] = useState<string | null>(null)

  const createGuestAddressId = useCallback(() => {
    if (typeof globalThis !== 'undefined') {
      const c = (globalThis as any).crypto
      const fn = c?.randomUUID
      if (typeof fn === 'function') return fn.call(c) as string
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`
  }, [])

  const handleGuestSelectAddress = useCallback(
    (address: GuestAddress) => {
      setSelectedGuestAddressId(address.__guestId)
      setShippingAddress(address)
      isPickupPlaceholderRef.current = false
    },
    [setSelectedGuestAddressId],
  )

  const handleGuestAddAddress = useCallback(
    (data: Partial<Address>) => {
      const __guestId = createGuestAddressId()
      const address = { ...data, __guestId } as GuestAddress
      // Guest checkout supports only ONE address.
      setGuestAddresses([address])
      setSelectedGuestAddressId(__guestId)
      setShippingAddress(address)
      isPickupPlaceholderRef.current = false
    },
    [createGuestAddressId],
  )

  // Guest pickup needs a shippingAddress for payment adapters.
  // We set a minimal placeholder based on the configured pickup location.
  useEffect(() => {
    if (user) return
    if (shippingMethod !== 'pickup') return
    if (shippingAddress) return
    if (!pickupLocation) return

    setShippingAddress({
      title: 'Mr/Ms',
      firstName,
      lastName,
      phone,
      addressLine1: pickupLocation,
      city: 'N/A',
      state: 'N/A',
      postalCode: '00000',
      country: 'VN',
      pickupDate: pickupDate ? format(pickupDate, 'yyyy-MM-dd') : undefined,
      pickupTime,
    })
    isPickupPlaceholderRef.current = true
  }, [
    user,
    shippingMethod,
    shippingAddress,
    pickupLocation,
    firstName,
    lastName,
    phone,
    pickupDate,
    pickupTime,
  ])

  // If guest switches back to delivery, force them to submit the real address form.
  useEffect(() => {
    if (user) return
    if (shippingMethod !== 'delivery') return
    if (!isPickupPlaceholderRef.current) return

    const selected = guestAddresses.find((a) => a.__guestId === selectedGuestAddressId)
    setShippingAddress(selected || undefined)
    isPickupPlaceholderRef.current = false
  }, [user, shippingMethod, guestAddresses, selectedGuestAddressId])

  useEffect(() => {
    if (shippingMethod !== 'pickup') return
    if (availablePickupTimeOptions.length === 0) return
    if (!availablePickupTimeOptions.includes(pickupTime)) {
      setPickupTime(availablePickupTimeOptions[0] || '')
    }
  }, [availablePickupTimeOptions, pickupTime, shippingMethod])

  // --- Discount state ---
  const [voucherCode, setVoucherCode] = useState<string | null>(null)
  const [voucherDiscount, setVoucherDiscount] = useState(0)
  const [levelDiscount, setLevelDiscount] = useState(0)
  const [originalSubtotal, setOriginalSubtotal] = useState(0)
  const [taxAmount, setTaxAmount] = useState(0)
  const [taxRates, setTaxRates] = useState<Array<{ name: string; rate: number; amount: number }>>(
    [],
  )

  const cartIsEmpty = !cart || !cart.items || !cart.items.length

  const canGoToPayment = Boolean((email || user) && shippingAddress && fullName && phone)

  const userLevel = user?.level || 'bronze'

  // Prefill Full Name from logged-in user (database) without overriding manual edits.
  useEffect(() => {
    if (didPrefillFromUserRef.current) return
    if (!user) return
    if (fullName.trim()) return

    const nameFromUser = typeof user.name === 'string' ? user.name.trim() : ''
    if (nameFromUser) {
      setFullName(nameFromUser)
      didPrefillFromUserRef.current = true
      lastSavedNameRef.current = nameFromUser
    }
  }, [user, fullName])

  // Persist Full Name to user.name (optional) when logged in.
  useEffect(() => {
    if (!user) return
    const next = fullName.trim()
    if (!next) return
    if (next === lastSavedNameRef.current) return

    const id = user.id
    if (!id) return

    const handle = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/${id}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: next }),
          })

          if (res.ok) {
            lastSavedNameRef.current = next
          }
        } catch {
          // ignore: checkout can proceed regardless
        }
      })()
    }, 800)

    return () => window.clearTimeout(handle)
  }, [user, fullName])

  // Prefill Phone from logged-in user (database) without overriding manual edits.
  useEffect(() => {
    if (didPrefillPhoneFromUserRef.current) return
    if (!user) return
    if (phone.trim()) return

    const phoneFromUser = typeof user.phone === 'string' ? user.phone.trim() : ''
    if (phoneFromUser) {
      setPhone(phoneFromUser)
      didPrefillPhoneFromUserRef.current = true
      lastSavedPhoneRef.current = phoneFromUser
    }
  }, [user, phone])

  // Persist phone to user (optional) when logged in.
  useEffect(() => {
    if (!user) return
    const next = phone.trim()
    if (!next) return
    if (next === lastSavedPhoneRef.current) return

    const id = user.id
    if (!id) return

    const handle = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/${id}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: next }),
          })

          if (res.ok) {
            lastSavedPhoneRef.current = next
          }
        } catch {
          // ignore: phone is optional, and checkout can proceed regardless
        }
      })()
    }, 800)

    return () => window.clearTimeout(handle)
  }, [user, phone])

  // Sync Full Name -> firstName/lastName for downstream payment payload.
  useEffect(() => {
    const parts = fullName.trim().split(/\s+/).filter(Boolean)
    const nextFirstName = parts[0] || ''
    const nextLastName = parts.slice(1).join(' ') || ''
    setFirstName(nextFirstName)
    setLastName(nextLastName)
  }, [fullName])

  const levelInfo = React.useMemo<LevelInfo | null>(() => {
    const match = levels.find((l) => l.level === userLevel)
    if (match && match.discountPercent > 0) {
      return {
        name: userLevel.charAt(0).toUpperCase() + userLevel.slice(1),
        discountPercent: match.discountPercent,
      }
    }
    return null
  }, [levels, userLevel])

  useEffect(() => {
    if (!user) return

    const touchCart = async () => {
      try {
        const cartId = (cart as Cart)?.id
        if (!cartId) return

        const patchRes = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/carts/${cartId}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })

        if (patchRes.ok) {
          const patchData = await patchRes.json()
          const activeCart = patchData?.doc as Cart
          if (activeCart) {
            setVoucherCode(activeCart.voucherCode || null)
            setVoucherDiscount(activeCart.voucherDiscount || 0)
            setLevelDiscount(activeCart.levelDiscount || 0)
            setOriginalSubtotal(activeCart.originalSubtotal || activeCart.subtotal || 0)
            setTaxAmount((activeCart.taxAmount as number) || 0)
            setTaxRates(
              (activeCart.taxRates as Array<{ name: string; rate: number; amount: number }>) || [],
            )

            if (process.env.TAX_DEBUG === '1' || process.env.PAYMENT_DEBUG === '1') {
              // eslint-disable-next-line no-console
              console.log('[TAX_DEBUG][checkout][touchCart]', {
                cartId: (cart as Cart)?.id,
                taxMode,
                taxAmount: activeCart.taxAmount,
                taxRatesCount: Array.isArray(activeCart.taxRates) ? activeCart.taxRates.length : 0,
                shippingFee: activeCart.shippingFee,
              })
            }
          }
        }
      } catch {
        // Silently fail
      }
    }

    void touchCart()
  }, [user, cart])

  // Guest: cart hook already contains computed pricing/tax fields,
  // but we need to copy them into local checkout state since the guest
  // `touchCart()` effect is skipped.
  useEffect(() => {
    if (user) return
    if (!cart) return

    setVoucherCode(cart.voucherCode || null)
    setVoucherDiscount((cart.voucherDiscount as number) || 0)
    setLevelDiscount((cart.levelDiscount as number) || 0)
    setOriginalSubtotal((cart.originalSubtotal as number) || (cart.subtotal as number) || 0)
    setTaxAmount((cart.taxAmount as number) || 0)
    setTaxRates(
      (cart.taxRates as Array<{ name: string; rate: number; amount: number }>) || [],
    )

    if (process.env.TAX_DEBUG === '1' || process.env.PAYMENT_DEBUG === '1') {
      // eslint-disable-next-line no-console
      console.log('[TAX_DEBUG][checkout][guestSync]', {
        cartId: (cart as Cart)?.id,
        taxMode,
        taxAmount: (cart as any)?.taxAmount,
        taxRatesCount: Array.isArray((cart as any)?.taxRates) ? (cart as any)?.taxRates.length : 0,
      })
    }
  }, [user, cart, taxMode])

  useEffect(() => {
    if (!shippingAddress && addresses && addresses.length > 0) {
      setShippingAddress(addresses[0])
    }
  }, [addresses, shippingAddress])

  const handleVoucherApplied = useCallback((data: any) => {
    setVoucherCode((data.voucherCode as string) || null)
    setVoucherDiscount((data.voucherDiscount as number) || 0)
    setLevelDiscount((data.levelDiscount as number) || 0)
    setOriginalSubtotal((data.originalSubtotal as number) || 0)
    setTaxAmount((data.taxAmount as number) || 0)
    setTaxRates((data.taxRates as Array<{ name: string; rate: number; amount: number }>) || [])
  }, [])

  const handleVoucherRemoved = useCallback((data: any) => {
    setVoucherCode(null)
    setVoucherDiscount(0)
    setLevelDiscount((data.levelDiscount as number) || 0)
    setOriginalSubtotal((data.originalSubtotal as number) || (data.subtotal as number) || 0)
    setTaxAmount((data.taxAmount as number) || 0)
    setTaxRates((data.taxRates as Array<{ name: string; rate: number; amount: number }>) || [])
  }, [])

  const initiatePaymentIntent = useCallback(
    async (paymentID: string) => {
      try {
        setProcessingPayment(true)

        if (user && voucherCode) {
          const validateRes = await fetch(
            `${process.env.NEXT_PUBLIC_SERVER_URL}/api/voucher-validate-for-payment`,
            {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
            },
          )
          if (!validateRes.ok) throw new Error('Voucher is no longer valid.')
        }

        // Keep pricing consistent with what the UI shows.
        const displaySubtotalForTotal =
          originalSubtotal > 0 ? originalSubtotal : cart?.subtotal || 0
        const netSubtotalForTotal = Math.max(
          0,
          displaySubtotalForTotal - voucherDiscount - levelDiscount,
        )
        const shippingFeeForTotal =
          shippingMethod === 'pickup'
            ? 0
            : freeShippingThreshold > 0 && netSubtotalForTotal >= freeShippingThreshold
              ? 0
              : shippingDefaultFee

        let orderTotalForTotal = netSubtotalForTotal
        if (taxMode === 'exclusive') orderTotalForTotal += taxAmount
        orderTotalForTotal += shippingFeeForTotal

        const pickupDateValue =
          shippingMethod === 'pickup' && pickupDate ? format(pickupDate, 'yyyy-MM-dd') : undefined

        const pickupTimeValue = shippingMethod === 'pickup' ? pickupTime : undefined

        // IMPORTANT: strip pickupDate/pickupTime for delivery.
        // Otherwise, if user previously switched pickup -> delivery, stale pickup values
        // can still be present on `shippingAddress` and then get saved to the order.
        const shippingAddressBase = (shippingAddress || {}) as Partial<Address> & {
          pickupDate?: string | null
          pickupTime?: string | null
        }
        const {
          pickupDate: _existingPickupDate,
          pickupTime: _existingPickupTime,
          ...shippingAddressWithoutPickup
        } = shippingAddressBase

        const shippingAddressWithPickupDateTime =
          shippingMethod === 'pickup'
            ? ({
                ...shippingAddressWithoutPickup,
                ...(pickupDateValue ? { pickupDate: pickupDateValue } : {}),
                ...(pickupTimeValue ? { pickupTime: pickupTimeValue } : {}),
              } as Partial<Address>)
            : shippingAddressWithoutPickup

        const paymentAddressWithMeta = {
          ...(shippingAddressWithPickupDateTime as any),
          // Embed fields into the address object so payment adapters can read them
          // even if plugin-ecommerce doesn't forward `additionalData` reliably.
          giftMessage: giftMessage.trim() || undefined,
          orderNotes: orderNotes.trim() || undefined,
          taxAmount,
          taxRates,
          shippingFee: shippingFeeForTotal,
          orderTotal: orderTotalForTotal,
        } as Partial<Address> & {
          giftMessage?: string
          orderNotes?: string
          taxAmount?: number
          taxRates?: unknown
          shippingFee?: number
          orderTotal?: number
        }

        if (process.env.PAYMENT_DEBUG === '1' || process.env.TAX_DEBUG === '1') {
          console.log('[PAYMENT_DEBUG][checkout]', {
            taxMode,
            taxAmount,
            taxRatesCount: Array.isArray(taxRates) ? taxRates.length : 0,
            taxRatesType: taxRates ? typeof taxRates : undefined,
            voucherCode,
            shippingMethod,
            shippingFeeForTotal,
            orderTotalForTotal,
          })
        }

        const initiatedData = (await initiatePayment(paymentID, {
          additionalData: {
            ...(email ? { customerEmail: email } : {}),
            billingAddress: paymentAddressWithMeta,
            shippingAddress: paymentAddressWithMeta,
            firstName,
            lastName,
            phone,
            giftMessage: giftMessage.trim() || undefined,
            orderNotes: orderNotes.trim() || undefined,
            taxAmount,
            taxRates,
            shippingFee: shippingFeeForTotal,
            orderTotal: orderTotalForTotal,
          },
        })) as Record<string, unknown>

        if (initiatedData) {
          if (paymentID === 'payos' && typeof initiatedData.checkoutUrl === 'string') {
            window.location.assign(initiatedData.checkoutUrl)
            return
          }

          const codOrderID = (initiatedData as any)?.orderID
          if (
            paymentID === 'cod' &&
            (typeof codOrderID === 'string' || typeof codOrderID === 'number')
          ) {
            const orderID = String(codOrderID)
            const accessToken = (initiatedData as any).accessToken as string | undefined
            const guestEmail = email || user?.email || ''

            // End cart session after successful COD.
            if (!user) {
              // For guests, also remove localStorage cart secret.
              clearSession()
            } else {
              void clearCart()
            }

            const query = new URLSearchParams()
            if (guestEmail) query.set('email', guestEmail)
            if (accessToken) query.set('accessToken', accessToken)

            router.push(`/orders/${orderID}${query.toString() ? `?${query.toString()}` : ''}`)
            return
          }

          setPaymentData(initiatedData)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred'
        toast.error(errorMessage)
      } finally {
        setProcessingPayment(false)
      }
    },
    [
      shippingAddress,
      email,
      firstName,
      lastName,
      phone,
      initiatePayment,
      user,
      voucherCode,
      router,
      originalSubtotal,
      voucherDiscount,
      levelDiscount,
      shippingMethod,
      pickupDate,
      pickupTime,
      freeShippingThreshold,
      shippingDefaultFee,
      taxMode,
      taxAmount,
      taxRates,
      giftMessage,
      orderNotes,
      cart,
    ],
  )

  if (!stripe) return null

  if (cartIsEmpty && isProcessingPayment) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <LoadingSpinner />
        <p className="mt-4 text-muted-foreground uppercase tracking-widest text-xs">
          Processing Order...
        </p>
      </div>
    )
  }

  if (cartIsEmpty) {
    return (
      <div className="container py-24 text-center">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <Button asChild variant="outline">
          <Link href="/shop">Continue Shopping</Link>
        </Button>
      </div>
    )
  }

  const displaySubtotal = originalSubtotal > 0 ? originalSubtotal : cart?.subtotal || 0
  const netSubtotal = Math.max(0, displaySubtotal - voucherDiscount - levelDiscount)
  const shippingFee =
    shippingMethod === 'pickup'
      ? 0
      : freeShippingThreshold > 0 && netSubtotal >= freeShippingThreshold
        ? 0
        : shippingDefaultFee

  let displayTotal = netSubtotal
  if (taxMode === 'exclusive') displayTotal += taxAmount
  displayTotal += shippingFee

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[1440px] mx-auto px-10 md:px-20 py-16">
        <h1 className="text-[32px] font-bold text-[#1A1A1C] mb-12">Checkout</h1>

        <div className="flex flex-col lg:flex-row gap-20 items-start">
          {/* Left Column - Forms */}
          <div className="flex-1 flex flex-col gap-12 w-full">
            {/* Basic Information */}
            <section className="space-y-4">
              <h2 className="text-[18px] font-semibold text-[#1A1A1C]">Basic Information</h2>

              {/* Pencil vOS5S: row1 (Full Name + Phone), then Email */}
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-[13px] font-semibold text-[#1A1A1C]">
                      Full Name *
                    </Label>
                    <Input
                      id="fullName"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="h-12 px-4 border-[#F0F0F2] focus:border-[#6E9E6E] rounded-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[13px] font-semibold text-[#1A1A1C]">
                      Phone Number *
                    </Label>
                    <Input
                      id="phone"
                      placeholder="Enter phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-12 px-4 border-[#F0F0F2] focus:border-[#6E9E6E] rounded-md"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[13px] font-semibold text-[#1A1A1C]">
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    value={email || user?.email || ''}
                    disabled={Boolean(user)}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 px-4 border-[#F0F0F2] focus:border-[#6E9E6E] rounded-md disabled:opacity-60 disabled:bg-[#F9F9FB] disabled:text-[#6E6E70] disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </section>

            {/* Shipping Information (Pencil VC74N) */}
            <section className="space-y-4">
              <h2 className="text-[18px] font-semibold text-[#1A1A1C]">Shipping Information</h2>

              {/* Toggle (ZtP7P gap 16) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setShippingMethod('delivery')}
                  className={cn(
                    'flex items-center gap-3 px-6 py-3 rounded-none border transition-colors text-left',
                    shippingMethod === 'delivery'
                      ? 'bg-[#F0F9F0] border-[#6E9E6E] border-2'
                      : 'bg-white border-[#F0F0F2] border',
                  )}
                >
                  <Truck
                    size={20}
                    className={cn(
                      shippingMethod === 'delivery' ? 'text-[#1A1A1C]' : 'text-[#6E6E70]',
                    )}
                  />
                  <span
                    className={cn(
                      'text-[14px]',
                      shippingMethod === 'delivery'
                        ? 'font-semibold text-[#1A1A1C]'
                        : 'font-normal text-[#6E6E70]',
                    )}
                  >
                    Delivery
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setShippingMethod('pickup')}
                  className={cn(
                    'flex items-center gap-3 px-6 py-3 rounded-none border transition-colors text-left',
                    shippingMethod === 'pickup'
                      ? 'bg-[#F0F9F0] border-[#6E9E6E] border-2'
                      : 'bg-white border-[#F0F0F2] border',
                  )}
                >
                  <Package
                    size={20}
                    className={cn(
                      shippingMethod === 'pickup' ? 'text-[#1A1A1C]' : 'text-[#6E6E70]',
                    )}
                  />
                  <span
                    className={cn(
                      'text-[14px]',
                      shippingMethod === 'pickup'
                        ? 'font-semibold text-[#1A1A1C]'
                        : 'font-normal text-[#6E6E70]',
                    )}
                  >
                    Pick up
                  </span>
                </button>
              </div>

              {shippingMethod === 'delivery' && (
                <div className="space-y-4">
                  <p className="text-[13px] font-medium text-[#6E6E70]">Select Shipping Address</p>
                  <div className="space-y-4">
                    {user ? (
                      <CheckoutAddresses
                        setAddressAction={setShippingAddress}
                        selectedAddress={shippingAddress as Address}
                        checkoutInitialData={{
                          firstName: nameParts.firstName,
                          lastName: nameParts.lastName,
                          phone,
                        }}
                      />
                    ) : (
                      <GuestCheckoutAddresses
                        addresses={guestAddresses}
                        selectedAddressId={selectedGuestAddressId}
                        initialData={{
                          firstName: nameParts.firstName,
                          lastName: nameParts.lastName,
                          phone,
                        }}
                        onSelectAddress={handleGuestSelectAddress}
                        onAddAddress={handleGuestAddAddress}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2 pb-3">
                    <Truck size={16} className="text-[#6E9E6E]" />
                    <span className="text-[13px] font-medium text-[#6E9E6E]">
                      Estimated delivery: Within 2-4 hours
                    </span>
                  </div>
                </div>
              )}

              {shippingMethod === 'pickup' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-[18px] font-semibold text-[#1A1A1C]">Pickup Schedule</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[13px] font-semibold text-[#1A1A1C]">
                          Pickup Date *
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="h-12 w-full px-4 border border-[#F0F0F2] flex items-center justify-between bg-white text-left"
                            >
                              <span className="text-[14px] font-normal text-[#1A1A1C]">
                                {pickupDate
                                  ? format(pickupDate, 'EEEE, MMMM d, yyyy')
                                  : 'Select a date'}
                              </span>
                              <CalendarIcon size={18} className="text-[#6E6E70]" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            align="start"
                            className="w-(--radix-popover-trigger-width) p-0 rounded-none border border-[#F0F0F2]"
                          >
                            <Calendar
                              mode="single"
                              selected={pickupDate}
                              onSelect={setPickupDate}
                              disabled={(date) => {
                                const d = new Date(date)
                                d.setHours(0, 0, 0, 0)
                                const today = new Date()
                                today.setHours(0, 0, 0, 0)
                                return d.getTime() < today.getTime()
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[13px] font-semibold text-[#1A1A1C]">
                          Pickup Time *
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="h-12 w-full px-4 border border-[#F0F0F2] flex items-center justify-between bg-white text-left"
                            >
                              <span className="text-[14px] font-normal text-[#1A1A1C]">
                                {pickupTime}
                              </span>
                              <Timer size={18} className="text-[#6E6E70]" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            align="start"
                            className="w-(--radix-popover-trigger-width) p-2 rounded-none border border-[#F0F0F2]"
                          >
                            <div className="max-h-56 overflow-auto">
                              {availablePickupTimeOptions.map((t) => (
                                <button
                                  key={t}
                                  type="button"
                                  className={cn(
                                    'w-full px-3 py-2 text-left text-[14px] rounded-none transition-colors',
                                    t === pickupTime
                                      ? 'bg-[#6E9E6E] text-white'
                                      : 'hover:bg-[#6E9E6E]/10 text-[#1A1A1C]',
                                  )}
                                  onClick={() => setPickupTime(t)}
                                >
                                  {t}
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#F9F9FB] border border-[#F0F0F2] p-4 space-y-2">
                    <p className="text-[13px] font-bold text-[#1A1A1C]">Pickup Location</p>
                    <p className="text-[13px] font-normal text-[#6E6E70] leading-[1.4]">
                      {pickupLocation}
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* Gift Message & Notes */}
            <section className="space-y-6">
              <h2 className="text-xl font-bold text-[#1A1A1C]">Gift Message & Notes</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#1A1A1C]">
                    Gift Message (Optional)
                  </Label>
                  <textarea
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                    className="w-full h-32 p-4 border border-[#F0F0F2] focus:border-[#6E9E6E] rounded-md text-sm outline-none resize-none"
                    placeholder="Write a sweet message for the recipient..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#1A1A1C]">Order Notes</Label>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full h-32 p-4 border border-[#F0F0F2] focus:border-[#6E9E6E] rounded-md text-sm outline-none resize-none"
                    placeholder="Specific instructions for delivery or packaging..."
                  />
                </div>
              </div>
            </section>

            {/* Payment Method (Pencil M0hts) */}
            <section className="space-y-4">
              <h2 className="text-[18px] font-semibold text-[#1A1A1C]">Payment Method</h2>

              <div className="space-y-3">
                {/* VietQR / PayOS (Q3mUa): gap 16, padding 16, border #E5E5E7 */}
                <button
                  className={cn(
                    'flex w-full items-center gap-4 p-4 border text-left transition-colors',
                    selectedPaymentMethod === 'payos'
                      ? 'border-[#6E9E6E] bg-[#F0F9F0]'
                      : 'border-[#E5E5E7] bg-white',
                  )}
                  onClick={(e) => {
                    e.preventDefault()
                    setSelectedPaymentMethod('payos')
                    setPaymentData(null)
                  }}
                  type="button"
                >
                  <QRCodeIcon className="h-6 w-auto text-[#1A1A1C]" />
                  <span className="text-[14px] font-normal text-[#6E6E70]">
                    VietQR (MoMo, ZaloPay, Banking)
                  </span>
                </button>

                {/* COD (qSkEU): gap 16, padding 16, border #F0F0F2 */}
                <button
                  className={cn(
                    'flex w-full items-center gap-4 p-4 border text-left transition-colors',
                    selectedPaymentMethod === 'cod'
                      ? 'border-[#6E9E6E] bg-[#F0F9F0]'
                      : 'border-[#F0F0F2] bg-white',
                  )}
                  onClick={(e) => {
                    e.preventDefault()
                    setSelectedPaymentMethod('cod')
                    setPaymentData(null)
                  }}
                  type="button"
                >
                  <div className="flex items-center justify-center w-6 h-6">
                    <Truck size={24} className="text-[#6E6E70]" />
                  </div>
                  <span className="text-[14px] font-normal text-[#6E6E70]">
                    Cash on Delivery (COD)
                  </span>
                </button>

                {/* Stripe card method kept as additional option (not in Pencil M0hts) */}
                <button
                  className={cn(
                    'flex w-full items-center gap-4 p-4 border text-left transition-colors',
                    selectedPaymentMethod === 'stripe'
                      ? 'border-[#6E9E6E] bg-[#F0F9F0]'
                      : 'border-[#F0F0F2] bg-white',
                  )}
                  onClick={(e) => {
                    e.preventDefault()
                    setSelectedPaymentMethod('stripe')
                    setPaymentData(null)
                  }}
                  type="button"
                >
                  <div className="flex items-center justify-center w-6 h-6">
                    <CreditCard size={24} className="text-[#6E6E70]" />
                  </div>
                  <span className="text-[14px] font-normal text-[#6E6E70]">Card (Stripe)</span>
                </button>
              </div>
            </section>

            {/* Stripe Payment Elements */}
            <Suspense fallback={null}>
              {selectedPaymentMethod === 'stripe' &&
                typeof paymentData?.['clientSecret'] === 'string' && (
                  <div className="pt-8 border-t border-[#F0F0F2]">
                    <Elements
                      options={{
                        appearance: {
                          theme: 'stripe',
                          variables: {
                            colorPrimary: '#6E9E6E',
                            colorBackground: '#ffffff',
                            colorText: '#1A1A1C',
                          },
                        },
                        clientSecret: paymentData['clientSecret'],
                      }}
                      stripe={stripe}
                    >
                      <CheckoutForm
                        customerEmail={email || user?.email || ''}
                        billingAddress={shippingAddress}
                        setProcessingPayment={setProcessingPayment}
                      />
                    </Elements>
                  </div>
                )}
            </Suspense>
          </div>

          {/* Right Column - Summary (Pencil EtGDG) */}
          <aside className="w-full lg:w-[480px] bg-[#F9F9FB] p-8 space-y-8 sticky top-32">
            <h2 className="text-[20px] font-bold text-[#1A1A1C]">Review your cart</h2>

            {/* Product list (pList gap 16) */}
            <div className="space-y-4">
              {cart?.items?.map((item, index) => {
                if (typeof item.product === 'object' && item.product) {
                  const { product } = item
                  const image = product.gallery?.[0]?.image || product.meta?.image
                  const productPrice = product.priceInVND || 0
                  const productId = String(product.id)
                  const saleUnitPrice = salePrices[productId]
                  const qty = item.quantity || 1
                  const originalLinePrice = productPrice * qty
                  const saleLinePrice =
                    typeof saleUnitPrice === 'number' && saleUnitPrice > 0
                      ? saleUnitPrice * qty
                      : null

                  return (
                    <div key={index} className="flex gap-4">
                      <div className="w-20 h-20 rounded-none overflow-hidden bg-white shrink-0">
                        {image && typeof image !== 'string' && (
                          <Media
                            resource={image}
                            className="relative w-full h-full"
                            fill
                            imgClassName="object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                        <h3 className="text-[14px] font-semibold text-[#1A1A1C] truncate">
                          {product.title}
                        </h3>
                        <p className="text-[13px] font-normal text-[#A0A0A5]">{`x${item.quantity}`}</p>
                      </div>
                      <div className="w-[130px] flex flex-col justify-center items-end gap-0.5">
                        {saleLinePrice != null && saleLinePrice < originalLinePrice && (
                          <Price
                            amount={originalLinePrice}
                            className="text-[11px] font-normal text-[#6E6E70] line-through"
                          />
                        )}
                        <Price
                          amount={
                            saleLinePrice != null && saleLinePrice < originalLinePrice
                              ? saleLinePrice
                              : originalLinePrice
                          }
                          className="text-[16px] font-bold text-[#6E9E6E]"
                        />
                      </div>
                    </div>
                  )
                }
                return null
              })}
            </div>

            {/* Voucher input (authenticated users only) */}
            {user && (
              <VoucherInput
                onAppliedAction={handleVoucherApplied}
                onRemovedAction={handleVoucherRemoved}
                currentVoucherCode={voucherCode}
              />
            )}

            {/* Totals wrapper (Kmm4g paddingTop 24, border-top) */}
            <div className="pt-6">
              <PriceBreakdown
                originalSubtotal={displaySubtotal}
                voucherDiscount={voucherDiscount}
                levelDiscount={levelDiscount}
                shippingFee={shippingFee}
                finalTotal={displayTotal}
                voucherCode={voucherCode}
                levelName={levelInfo?.name}
                levelDiscountPercent={levelInfo?.discountPercent}
                taxRates={taxRates}
                taxMode={taxMode}
              />
            </div>

            <Button
              className="w-full h-14 bg-[#6E9E6E] hover:bg-[#5D8A5D] text-white text-[16px] font-bold rounded-none"
              disabled={!canGoToPayment || isProcessingPayment}
              onClick={() => initiatePaymentIntent(selectedPaymentMethod)}
            >
              {isProcessingPayment ? <LoadingSpinner /> : 'Pay Now'}
            </Button>

            {/* Trust block (VNzdr) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-[#1A1A1C]" />
                <span className="text-[13px] font-bold text-[#1A1A1C]">
                  Secure Checkout - SSL Encrypted
                </span>
              </div>
              <p className="text-[12px] font-normal text-[#6E6E70] leading-[1.4]">
                Ensuring your financial and personal details are secure during every transaction.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
