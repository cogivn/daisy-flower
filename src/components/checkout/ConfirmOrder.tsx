'use client'

import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useCart, usePayments } from '@payloadcms/plugin-ecommerce/client/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'

export const ConfirmOrder: React.FC = () => {
  const { confirmOrder } = usePayments()
  const { cart } = useCart()

  const searchParams = useSearchParams()
  const router = useRouter()
  // Ensure we only confirm the order once, even if the component re-renders
  const isConfirming = useRef(false)

  useEffect(() => {
    if (!cart || !cart.items || cart.items?.length === 0) {
      return
    }

    const paymentMethod = searchParams.get('paymentMethod') || 'stripe'
    const paymentIntentID = searchParams.get('payment_intent')
    const orderCode = searchParams.get('orderCode')
    const email = searchParams.get('email')

    if (isConfirming.current) return

    // Stripe return
    const hasStripeParams = Boolean(paymentIntentID)
    // PayOS return
    const hasPayOSParams = Boolean(orderCode)

    if (!hasStripeParams && !hasPayOSParams) {
      router.push('/')
      return
    }

    isConfirming.current = true

    const additionalData =
      paymentMethod === 'payos'
        ? { orderCode: Number(orderCode), ...(email ? { customerEmail: email } : {}) }
        : { paymentIntentID }

    confirmOrder(paymentMethod, { additionalData }).then((result) => {
      if (result && typeof result === 'object' && 'orderID' in result && result.orderID) {
        const accessToken = 'accessToken' in result ? (result.accessToken as string) : ''
        const queryParams = new URLSearchParams()

        if (email) queryParams.set('email', email)
        if (accessToken) queryParams.set('accessToken', accessToken)

        const queryString = queryParams.toString()
        router.push(`/orders/${result.orderID}${queryString ? `?${queryString}` : ''}`)
      }
    })
  }, [cart, confirmOrder, router, searchParams])

  return (
    <div className="text-center w-full flex flex-col items-center justify-start gap-4">
      <h1 className="text-2xl">Confirming Order</h1>

      <LoadingSpinner className="w-12 h-6" />
    </div>
  )
}
