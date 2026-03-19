import Stripe from 'stripe'
import type { PaymentAdapter, PaymentAdapterArgs } from '@payloadcms/plugin-ecommerce/types'

type StripeAdapterArgs = {
  secretKey: string
  publishableKey?: string
  webhookSecret?: string
} & PaymentAdapterArgs

export const stripeAdapter = (props: StripeAdapterArgs): PaymentAdapter => {
  const label = props?.label || 'Stripe'

  const baseFields = [
    { name: 'customerID', type: 'text', label: 'Stripe Customer ID' },
    { name: 'paymentIntentID', type: 'text', label: 'Stripe PaymentIntent ID' },
  ] as any[]

  const groupField: any = {
    name: 'stripe',
    type: 'group',
    admin: {
      condition: (data: any) => {
        const path = 'paymentMethod'
        return data?.[path] === 'stripe'
      },
    },
    fields: baseFields,
  }

  return {
    name: 'stripe',
    label,
    group: groupField,

    initiatePayment: async ({ data, req, transactionsSlug }) => {
      const payload = req.payload
      const { secretKey } = props

      const { customerEmail, currency, cart, billingAddress, shippingAddress } = data as any

      // Notes / pricing from checkout UI:
      // plugin-ecommerce passes a subset into the adapter `data` param, but the full
      // request body still contains our `additionalData`.
      const reqAny = req as any
      const root = {
        ...(reqAny?.data ?? {}),
        ...(reqAny?.body ?? {}),
        ...(reqAny?.req?.body ?? {}),
      } as Record<string, unknown>

      // plugin-ecommerce may nest our payload under `additionalData`
      // (depending on middleware / request shaping), so check there first.
      const additionalData =
        (reqAny?.data?.additionalData as Record<string, unknown> | undefined) ??
        (reqAny?.body?.additionalData as Record<string, unknown> | undefined) ??
        (reqAny?.req?.body?.additionalData as Record<string, unknown> | undefined) ??
        (root as any)?.additionalData

      const giftMessageValue =
        additionalData?.giftMessage ??
        root?.giftMessage ??
        (billingAddress as any)?.giftMessage ??
        (shippingAddress as any)?.giftMessage

      const orderNotesValue =
        additionalData?.orderNotes ??
        root?.orderNotes ??
        (billingAddress as any)?.orderNotes ??
        (shippingAddress as any)?.orderNotes
      const giftMessage =
        typeof giftMessageValue === 'string' ? giftMessageValue.trim() || undefined : undefined
      const orderNotes =
        typeof orderNotesValue === 'string' ? orderNotesValue.trim() || undefined : undefined

      const taxAmountCandidates: unknown[] = [
        additionalData?.taxAmount,
        root?.taxAmount,
        (billingAddress as any)?.taxAmount,
        (shippingAddress as any)?.taxAmount,
      ]

      const parseNumber = (v: unknown): number | undefined => {
        if (typeof v === 'number' && Number.isFinite(v)) return v
        if (typeof v === 'string') {
          const n = Number(v)
          return Number.isFinite(n) ? n : undefined
        }
        return undefined
      }

      const parsedTaxAmounts = taxAmountCandidates.map(parseNumber).filter((v): v is number => v !== undefined)
      const taxAmount = parsedTaxAmounts.find((n) => n > 0) ?? parsedTaxAmounts[0] ?? 0

      const taxRatesCandidates: unknown[] = [
        additionalData?.taxRates,
        root?.taxRates,
        (billingAddress as any)?.taxRates,
        (shippingAddress as any)?.taxRates,
      ]

      const normalizeTaxRatesToArray = (raw: unknown): unknown[] => {
        if (raw == null) return []
        if (Array.isArray(raw)) return raw
        if (typeof raw === 'string') {
          try {
            const parsed = JSON.parse(raw)
            return Array.isArray(parsed) ? parsed : []
          } catch {
            return []
          }
        }
        if (typeof raw === 'object') {
          const maybeTaxRates =
            (raw as any).taxRates ?? (raw as any).rates ?? (raw as any).data ?? raw
          return Array.isArray(maybeTaxRates) ? maybeTaxRates : []
        }
        return []
      }

      const parsedTaxRatesArrays = taxRatesCandidates.map(normalizeTaxRatesToArray)
      const taxRates = parsedTaxRatesArrays.find((arr) => arr.length > 0) ?? parsedTaxRatesArrays[0] ?? []

      if (!secretKey) throw new Error('Stripe secret key is required.')
      if (!currency) throw new Error('Currency is required.')
      if (!cart || !cart.items || cart.items.length === 0) throw new Error('Cart is empty.')
      if (!customerEmail || typeof customerEmail !== 'string')
        throw new Error('A valid customer email is required to make a purchase.')

      const orderTotalRaw =
        additionalData?.orderTotal ??
        root?.orderTotal ??
        root?.totalAmount ??
        (billingAddress as any)?.orderTotal ??
        (shippingAddress as any)?.orderTotal

      const orderTotal =
        typeof orderTotalRaw === 'number'
          ? orderTotalRaw
          : typeof orderTotalRaw === 'string'
            ? Number(orderTotalRaw)
            : NaN

      const amount = Number.isFinite(orderTotal) ? orderTotal : cart.subtotal
      if (!amount || typeof amount !== 'number' || amount <= 0)
        throw new Error('A valid amount is required to initiate a payment.')

      const shippingFeeRaw =
        additionalData?.shippingFee ??
        root?.shippingFee ??
        (billingAddress as any)?.shippingFee ??
        (shippingAddress as any)?.shippingFee
      const shippingFee =
        typeof shippingFeeRaw === 'number'
          ? shippingFeeRaw
          : typeof shippingFeeRaw === 'string'
            ? Number(shippingFeeRaw)
            : 0

      const debugPayment = process.env.PAYMENT_DEBUG === '1'
      if (debugPayment) {
        console.log('[PAYMENT_DEBUG][stripe][initiate]', {
          giftMessage,
          orderNotes,
          taxAmount,
          taxRatesCount: Array.isArray(taxRates) ? taxRates.length : 0,
          shippingFee,
          orderTotal,
          amount,
          currency,
          customerEmail,
          cartId: cart.id,
        })
      }

      const stripe = new Stripe(secretKey, {
        apiVersion: '2025-08-27.basil',
      })

      const flattenedCart = cart.items.map((item: any) => {
        const productID = typeof item.product === 'object' ? item.product.id : item.product
        const variantID = item.variant
          ? typeof item.variant === 'object'
            ? item.variant.id
            : item.variant
          : undefined

        const { product: _product, variant: _variant, ...customProperties } = item as any

        return {
          ...customProperties,
          product: productID,
          quantity: item.quantity,
          ...(variantID ? { variant: variantID } : {}),
        }
      })

      const customer = (await stripe.customers.list({ email: customerEmail })).data[0] as
        | Stripe.Customer
        | undefined

      const ensuredCustomer = customer?.id
        ? customer
        : await stripe.customers.create({
            email: customerEmail,
          })

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        automatic_payment_methods: { enabled: true },
        currency,
        customer: ensuredCustomer.id,
        metadata: {
          cartID: cart.id,
          cartItemsSnapshot: JSON.stringify(flattenedCart),
          shippingAddress: JSON.stringify(shippingAddress || {}),
          giftMessage: giftMessage || '',
          orderNotes: orderNotes || '',
          shippingFee: String(shippingFee ?? 0),
          orderTotal: String(amount ?? 0),
          taxAmount: String(taxAmount ?? 0),
          taxRates: JSON.stringify(taxRates ?? []),
        },
      })

      const transaction = await payload.create({
        collection: transactionsSlug as any,
        data: {
          ...(req.user ? { customer: req.user.id } : { customerEmail }),
          amount: paymentIntent.amount,
          billingAddress,
          cart: cart.id,
          currency: paymentIntent.currency.toUpperCase(),
          items: flattenedCart,
          paymentMethod: 'stripe',
          status: 'pending',
          giftMessage,
          orderNotes,
          taxAmount,
          taxRates,
          shippingFee,
          stripe: {
            customerID: ensuredCustomer.id,
            paymentIntentID: paymentIntent.id,
          },
        } as any,
      })

      return {
        clientSecret: paymentIntent.client_secret || '',
        message: 'Payment initiated successfully',
        paymentIntentID: paymentIntent.id,
        transactionID: transaction.id,
      }
    },

    confirmOrder: async ({
      cartsSlug = 'carts',
      data,
      ordersSlug = 'orders',
      req,
      transactionsSlug = 'transactions',
    }) => {
      const payload = req.payload
      const { secretKey } = props

      if (!secretKey) throw new Error('Stripe secret key is required')

      const paymentIntentID = (data as any)?.paymentIntentID as string | undefined
      if (!paymentIntentID) throw new Error('PaymentIntent ID is required')

      const stripe = new Stripe(secretKey, {
        apiVersion: '2025-08-27.basil',
      })

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentID)
      const cartID = paymentIntent.metadata?.cartID
      const cartItemsSnapshot = paymentIntent.metadata?.cartItemsSnapshot
        ? JSON.parse(paymentIntent.metadata.cartItemsSnapshot)
        : undefined
      const shippingAddress = paymentIntent.metadata?.shippingAddress
        ? JSON.parse(paymentIntent.metadata.shippingAddress)
        : undefined

      const shippingType =
        (shippingAddress as any)?.pickupDate || (shippingAddress as any)?.pickupTime
          ? 'pickup'
          : 'delivery'

      const giftMessageFromMeta =
        (paymentIntent.metadata?.giftMessage as string | undefined)?.trim() || undefined
      const orderNotesFromMeta =
        (paymentIntent.metadata?.orderNotes as string | undefined)?.trim() || undefined

      const shippingFeeFromMetaRaw = paymentIntent.metadata?.shippingFee
      const shippingFeeFromMeta =
        typeof shippingFeeFromMetaRaw === 'string'
          ? Number(shippingFeeFromMetaRaw)
          : 0

      const orderTotalFromMetaRaw = paymentIntent.metadata?.orderTotal
      const orderTotalFromMeta =
        typeof orderTotalFromMetaRaw === 'string' ? Number(orderTotalFromMetaRaw) : undefined

      const taxAmountFromMetaRaw = paymentIntent.metadata?.taxAmount
      const taxAmountFromMeta =
        typeof taxAmountFromMetaRaw === 'string' ? Number(taxAmountFromMetaRaw) : undefined

      const taxRatesFromMetaRaw = paymentIntent.metadata?.taxRates
      let taxRatesFromMeta: unknown[] | undefined = undefined
      if (typeof taxRatesFromMetaRaw === 'string') {
        try {
          const parsed = JSON.parse(taxRatesFromMetaRaw)
          taxRatesFromMeta = Array.isArray(parsed) ? parsed : []
        } catch {
          taxRatesFromMeta = []
        }
      }

      const transactionsResults = await payload.find({
        collection: transactionsSlug as any,
        where: { 'stripe.paymentIntentID': { equals: paymentIntentID } } as any,
      })

      const transaction = transactionsResults.docs[0] as any
      if (!transactionsResults.totalDocs || !transaction) {
        throw new Error('No transaction found for the provided PaymentIntent ID')
      }

      const debugPayment = process.env.PAYMENT_DEBUG === '1'
      if (debugPayment) {
        console.log('[PAYMENT_DEBUG][stripe][confirmOrder][transaction]', {
          paymentIntentID,
          transaction: {
            id: transaction.id,
            giftMessage: transaction.giftMessage,
            orderNotes: transaction.orderNotes,
            taxAmount: transaction.taxAmount,
            taxRatesCount: Array.isArray(transaction.taxRates) ? transaction.taxRates.length : 0,
            shippingFee: transaction.shippingFee,
          },
          meta: {
            giftMessageFromMeta,
            orderNotesFromMeta,
            taxAmountFromMeta,
            taxRatesFromMetaCount: Array.isArray(taxRatesFromMeta) ? taxRatesFromMeta.length : 0,
            shippingFeeFromMeta,
          },
        })
      }

      const order = await payload.create({
        collection: ordersSlug as any,
        data: {
          amount: orderTotalFromMeta ?? paymentIntent.amount,
          currency: paymentIntent.currency?.toUpperCase?.() || 'VND',
          ...(req.user
            ? { customer: req.user.id }
            : { customerEmail: (data as any)?.customerEmail }),
          items: cartItemsSnapshot,
          shippingAddress,
          shippingType,
          status: 'processing',
          transactions: [transaction.id],
          giftMessage: transaction.giftMessage ?? giftMessageFromMeta,
          orderNotes: transaction.orderNotes ?? orderNotesFromMeta,
          taxAmount: transaction.taxAmount ?? taxAmountFromMeta ?? 0,
          taxRates: transaction.taxRates ?? taxRatesFromMeta ?? [],
          shippingFee: Number.isFinite(shippingFeeFromMeta) ? shippingFeeFromMeta : 0,
        } as any,
      })

      const timestamp = new Date().toISOString()
      if (cartID) {
        await payload.update({
          id: cartID,
          collection: cartsSlug as any,
          data: { purchasedAt: timestamp } as any,
          overrideAccess: true,
          req,
        })
      }

      await payload.update({
        id: transaction.id,
        collection: transactionsSlug as any,
        data: {
          order: order.id,
          status: 'succeeded',
        } as any,
      })

      return {
        message: 'Payment initiated successfully',
        orderID: order.id,
        transactionID: transaction.id,
      }
    },
  }
}
