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
import React, { Suspense, useCallback, useEffect, useState } from 'react'

import { CheckoutAddresses } from '@/components/checkout/CheckoutAddresses'
import { PriceBreakdown } from '@/components/checkout/PriceBreakdown'
import { VoucherInput } from '@/components/checkout/VoucherInput'
import { CheckoutForm } from '@/components/forms/CheckoutForm'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Address, Cart } from '@/payload-types'
import { useAddresses, useCart, usePayments } from '@payloadcms/plugin-ecommerce/client/react'
import { toast } from 'sonner'
import { cn } from '@/utilities/cn'
import { ShieldCheck, Truck, CreditCard } from 'lucide-react'

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
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  levels = [],
  taxMode = 'exclusive',
}) => {
  const { user } = useAuth()
  const { cart } = useCart()
  
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  
  const [paymentData, setPaymentData] = useState<null | Record<string, unknown>>(null)
  const { initiatePayment } = usePayments()
  const { addresses: rawAddresses } = useAddresses()

  const addresses = React.useMemo(() => {
    if (!rawAddresses || !user) return []
    return rawAddresses.filter((address) => {
      const customerId =
        typeof address.customer === 'object' ? address.customer?.id : address.customer
      return customerId === user.id
    })
  }, [rawAddresses, user])

  const [shippingAddress, setShippingAddress] = useState<Partial<Address>>()
  const [shippingMethod, setShippingMethod] = useState<'delivery' | 'pickup'>('delivery')
  const [isProcessingPayment, setProcessingPayment] = useState(false)

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

  const canGoToPayment = Boolean(
    (email || user) && shippingAddress && firstName && lastName && phone
  )

  const userLevel = user?.level || 'bronze'

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
          }
        }
      } catch {
        // Silently fail
      }
    }

    void touchCart()
  }, [user, cart])

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

        const initiatedData = (await initiatePayment(paymentID, {
          additionalData: {
            ...(email ? { customerEmail: email } : {}),
            billingAddress: shippingAddress,
            shippingAddress,
            firstName,
            lastName,
            phone,
          },
        })) as Record<string, unknown>

        if (initiatedData) {
          setPaymentData(initiatedData)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred'
        toast.error(errorMessage)
      } finally {
        setProcessingPayment(false)
      }
    },
    [shippingAddress, email, firstName, lastName, phone, initiatePayment, user, voucherCode],
  )

  if (!stripe) return null

  if (cartIsEmpty && isProcessingPayment) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <LoadingSpinner />
        <p className="mt-4 text-muted-foreground uppercase tracking-widest text-xs">Processing Order...</p>
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
  let displayTotal = Math.max(0, displaySubtotal - voucherDiscount - levelDiscount)
  if (taxMode === 'exclusive') displayTotal += taxAmount

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[1440px] mx-auto px-10 md:px-20 py-16">
        <h1 className="text-[32px] font-bold text-[#1A1A1C] mb-12">Checkout</h1>

        <div className="flex flex-col lg:flex-row gap-20 items-start">
          {/* Left Column - Forms */}
          <div className="flex-1 flex flex-col gap-12 w-full">
            
            {/* Basic Information */}
            <section className="space-y-6">
              <h2 className="text-xl font-bold text-[#1A1A1C]">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium text-[#1A1A1C]">First Name *</Label>
                  <Input 
                    id="firstName" 
                    placeholder="Enter first name" 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-12 border-[#F0F0F2] focus:border-[#6E9E6E] rounded-md" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium text-[#1A1A1C]">Last Name *</Label>
                  <Input 
                    id="lastName" 
                    placeholder="Enter last name" 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-12 border-[#F0F0F2] focus:border-[#6E9E6E] rounded-md" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-[#1A1A1C]">Email Address *</Label>
                  <Input 
                    id="email" 
                    type="email"
                    placeholder="Enter email address" 
                    value={email || user?.email || ''}
                    disabled={Boolean(user)}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 border-[#F0F0F2] focus:border-[#6E9E6E] rounded-md" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-[#1A1A1C]">Phone Number *</Label>
                  <Input 
                    id="phone" 
                    placeholder="Enter phone number" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-12 border-[#F0F0F2] focus:border-[#6E9E6E] rounded-md" 
                  />
                </div>
              </div>
            </section>

            {/* Shipping Information */}
            <section className="space-y-6">
              <h2 className="text-xl font-bold text-[#1A1A1C]">Shipping Information</h2>
              
              {/* Shipping Method Tabs */}
              <div className="flex border border-[#F0F0F2] rounded-md overflow-hidden h-12">
                <button 
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 text-sm font-medium transition-colors",
                    shippingMethod === 'delivery' ? "bg-[#F0FDF4] text-[#6E9E6E]" : "bg-white text-[#6E6E70]"
                  )}
                  onClick={() => setShippingMethod('delivery')}
                >
                  <Truck size={18} />
                  Delivery
                </button>
                <button 
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 text-sm font-medium transition-colors border-l border-[#F0F0F2]",
                    shippingMethod === 'pickup' ? "bg-[#F0FDF4] text-[#6E9E6E]" : "bg-white text-[#6E6E70]"
                  )}
                  onClick={() => setShippingMethod('pickup')}
                >
                  <CreditCard size={18} />
                  Pick Up
                </button>
              </div>

              {shippingMethod === 'delivery' && (
                <div className="space-y-4">
                  <CheckoutAddresses 
                    setAddressAction={setShippingAddress} 
                    selectedAddress={shippingAddress as Address} 
                  />
                </div>
              )}

              {shippingMethod === 'pickup' && (
                <div className="p-6 rounded-lg border border-[#F0F0F2] bg-[#F9F9FB] text-[#6E6E70] text-sm italic">
                  Store pickup is currently being coordinated. We will contact you with the pickup location details.
                </div>
              )}
            </section>

            {/* Gift Message & Notes */}
            <section className="space-y-6">
              <h2 className="text-xl font-bold text-[#1A1A1C]">Gift Message & Notes</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#1A1A1C]">Gift Message (Optional)</Label>
                  <textarea 
                    className="w-full h-32 p-4 border border-[#F0F0F2] focus:border-[#6E9E6E] rounded-md text-sm outline-none resize-none"
                    placeholder="Write a sweet message for the recipient..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#1A1A1C]">Order Notes</Label>
                  <textarea 
                    className="w-full h-32 p-4 border border-[#F0F0F2] focus:border-[#6E9E6E] rounded-md text-sm outline-none resize-none"
                    placeholder="Specific instructions for delivery or packaging..."
                  />
                </div>
              </div>
            </section>

            {/* Payment Method */}
            <section className="space-y-6">
              <h2 className="text-xl font-bold text-[#1A1A1C]">Payment Method</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-4 rounded-lg border border-[#F0F0F2] bg-white">
                  <div className="w-5 h-5 rounded-full border-2 border-[#6E9E6E] flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#6E9E6E]" />
                  </div>
                  <Truck size={20} className="text-[#6E6E70]" />
                  <span className="text-sm font-medium text-[#1A1A1C]">Cash on Delivery (COD)</span>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-lg border border-[#F0F0F2] bg-white opacity-50 cursor-not-allowed">
                  <div className="w-5 h-5 rounded-full border-2 border-[#F0F0F2]" />
                  <CreditCard size={20} className="text-[#6E6E70]" />
                  <span className="text-sm font-medium text-[#1A1A1C]">QR Code, MoMo, ZaloPay, Banking (Coming Soon)</span>
                </div>
              </div>
            </section>

            {/* Stripe Payment Elements */}
            <Suspense fallback={null}>
              {typeof paymentData?.['clientSecret'] === 'string' && (
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

          {/* Right Column - Summary */}
          <aside className="w-full lg:w-[480px] bg-[#F9F9FB] rounded-2xl border border-[#F0F0F2] p-8 space-y-8 sticky top-32">
            <h2 className="text-xl font-bold text-[#1A1A1C]">Review your cart</h2>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {cart?.items?.map((item, index) => {
                if (typeof item.product === 'object' && item.product) {
                  const { product } = item
                  const image = product.meta?.image
                  const productPrice = product.priceInVND || 0
                  
                  return (
                    <div key={index} className="flex gap-4 items-center">
                      <div className="w-16 h-16 rounded-lg overflow-hidden border border-[#F0F0F2] bg-white shrink-0">
                        {image && typeof image !== 'string' && (
                          <Media resource={image} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-[#1A1A1C] truncate">{product.title}</h3>
                        <p className="text-xs text-[#6E6E70]">Qty: {item.quantity}</p>
                      </div>
                      <Price amount={productPrice * (item.quantity || 1)} className="text-sm font-bold text-[#6E9E6E]" />
                    </div>
                  )
                }
                return null
              })}
            </div>

            {/* Voucher Input */}
            <VoucherInput 
              onAppliedAction={handleVoucherApplied} 
              onRemovedAction={handleVoucherRemoved}
              currentVoucherCode={voucherCode} 
            />

            <PriceBreakdown 
               originalSubtotal={displaySubtotal}
               voucherDiscount={voucherDiscount}
               levelDiscount={levelDiscount}
               finalTotal={displayTotal}
               voucherCode={voucherCode}
               levelName={levelInfo?.name}
               levelDiscountPercent={levelInfo?.discountPercent}
               taxRates={taxRates}
               taxMode={taxMode}
            />

            <Button 
              className="w-full h-14 bg-[#6E9E6E] hover:bg-[#5D8A5D] text-white text-lg font-bold rounded-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
              disabled={!canGoToPayment || isProcessingPayment}
              onClick={() => initiatePaymentIntent('stripe')}
            >
              {isProcessingPayment ? <LoadingSpinner /> : 'Pay Now'}
            </Button>

            <div className="flex flex-col gap-2 pt-4 border-t border-[#F0F0F2]">
              <div className="flex items-center gap-2 text-xs text-[#6E6E70]">
                <ShieldCheck size={16} className="text-[#6E9E6E]" />
                Secure checkout - SSL Encrypted
              </div>
              <p className="text-[10px] text-[#6E6E70] leading-relaxed">
                Your legal personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our privacy policy.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
