import { PayOS } from '@payos/node'
import type {
  PaymentAdapter,
  PaymentAdapterArgs,
  PaymentAdapterClient,
  PaymentAdapterClientArgs,
} from '@payloadcms/plugin-ecommerce/types'
import type { GroupField } from 'payload'

type PayOSAdapterArgs = {
  clientId: string
  apiKey: string
  checksumKey: string
  /**
   * Used in PayOS create-payment-link request
   */
  returnUrlBase: string
  cancelUrlBase: string
} & PaymentAdapterArgs

export const payosAdapter = (props: PayOSAdapterArgs): PaymentAdapter => {
  const label = props?.label || 'PayOS'

  const baseFields = [
    { name: 'orderCode', type: 'number', label: 'PayOS Order Code' },
    { name: 'paymentLinkId', type: 'text', label: 'PayOS Payment Link ID' },
    { name: 'status', type: 'text', label: 'PayOS Payment Status' },
  ] as const

  const groupOverrides = props.groupOverrides

  const groupField: GroupField = {
    name: 'payos',
    type: 'group',
    ...(groupOverrides || {}),
    admin: {
      condition: (data) => data?.paymentMethod === 'payos',
      ...(groupOverrides?.admin || {}),
    },
    fields:
      groupOverrides?.fields && typeof groupOverrides.fields === 'function'
        ? groupOverrides.fields({ defaultFields: [...baseFields] as any })
        : ([...baseFields] as any),
  }

  return {
    name: 'payos',
    label,
    group: groupField,
    initiatePayment: async ({ data, req, transactionsSlug }) => {
      const payload = req.payload

      const { cart, currency, customerEmail, billingAddress, shippingAddress } = data
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

      if (!currency) throw new Error('Currency is required.')
      if (currency !== 'VND') throw new Error('PayOS adapter currently supports VND only.')
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
        console.log('[PAYMENT_DEBUG][payos][initiate]', {
          giftMessage,
          orderNotes,
          taxAmount,
          taxRatesCount: Array.isArray(taxRates) ? taxRates.length : 0,
          shippingFee,
          orderTotal: Number.isFinite(orderTotal) ? orderTotal : undefined,
          currency,
          customerEmail,
          cartId: cart.id,
          debugSources: {
            additionalDataGiftMessageType: typeof (additionalData as any)?.giftMessage,
            rootGiftMessageType: typeof (root as any)?.giftMessage,
            additionalDataTaxAmountType: typeof (additionalData as any)?.taxAmount,
            rootTaxAmountType: typeof (root as any)?.taxAmount,
            additionalDataTaxRatesType: typeof (additionalData as any)?.taxRates,
            rootTaxRatesType: typeof (root as any)?.taxRates,
            additionalDataShippingFeeType: typeof (additionalData as any)?.shippingFee,
            rootShippingFeeType: typeof (root as any)?.shippingFee,
          },
        })
      }

      const amount = Number.isFinite(orderTotal) ? orderTotal : cart.subtotal
      if (!amount || typeof amount !== 'number' || amount <= 0)
        throw new Error('A valid amount is required to initiate a payment.')

      const payos = new PayOS({
        clientId: props.clientId,
        apiKey: props.apiKey,
        checksumKey: props.checksumKey,
      })

      const flattenedCart = cart.items.map((item) => {
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

      // PayOS requires numeric orderCode. Use timestamp + random (still within JS safe int).
      const orderCode = Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(0, 12))

      const returnUrl = `${props.returnUrlBase}?paymentMethod=payos&orderCode=${orderCode}${
        customerEmail ? `&email=${encodeURIComponent(customerEmail)}` : ''
      }`
      const cancelUrl = `${props.cancelUrlBase}?paymentCancelled=1`

      const description = `Order ${orderCode}`

      const paymentLink = await payos.paymentRequests.create({
        orderCode,
        amount,
        description,
        returnUrl,
        cancelUrl,
        buyerEmail: customerEmail,
        buyerPhone: billingAddress?.phone || undefined,
        buyerAddress: billingAddress?.addressLine1 || undefined,
        items: cart.items.map((item) => ({
          name:
            typeof item.product === 'object' && item.product
              ? (item.product.title as string) || 'Product'
              : 'Product',
          quantity: item.quantity,
          price: 0, // Optional per-item price; total amount is authoritative
        })),
      })

      await payload.create({
        collection: transactionsSlug as any,
        data: {
          ...(req.user ? { customer: req.user.id } : { customerEmail }),
          amount,
          shippingFee,
          billingAddress,
          shippingAddress,
          cart: cart.id,
          currency,
          items: flattenedCart,
          paymentMethod: 'payos',
          status: 'pending',
          giftMessage,
          orderNotes,
          taxAmount,
          taxRates,
          payos: {
            orderCode: paymentLink.orderCode,
            paymentLinkId: paymentLink.paymentLinkId,
            status: paymentLink.status,
          },
        } as any,
      })

      return {
        message: 'Payment initiated successfully',
        checkoutUrl: paymentLink.checkoutUrl,
        orderCode: paymentLink.orderCode,
        paymentLinkId: paymentLink.paymentLinkId,
        qrCode: paymentLink.qrCode,
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

      const orderCode = Number((data as any)?.orderCode)
      const customerEmail = (data as any)?.customerEmail as string | undefined
      if (!orderCode || Number.isNaN(orderCode)) throw new Error('PayOS orderCode is required')

      const payos = new PayOS({
        clientId: props.clientId,
        apiKey: props.apiKey,
        checksumKey: props.checksumKey,
      })

      const transactionsResults = await payload.find({
        collection: transactionsSlug as any,
        where: { 'payos.orderCode': { equals: orderCode } } as any,
      })

      const transaction = transactionsResults.docs[0] as any
      if (!transactionsResults.totalDocs || !transaction) {
        throw new Error('No transaction found for the provided PayOS orderCode')
      }

      const debugPayment = process.env.PAYMENT_DEBUG === '1'
      if (debugPayment) {
        console.log('[PAYMENT_DEBUG][payos][confirmOrder][transaction]', {
          orderCode,
          transaction: {
            giftMessage: (transaction as any)?.giftMessage,
            orderNotes: (transaction as any)?.orderNotes,
            taxAmount: (transaction as any)?.taxAmount,
            taxRatesCount: Array.isArray((transaction as any)?.taxRates)
              ? (transaction as any)?.taxRates.length
              : 0,
            shippingFee: (transaction as any)?.shippingFee,
            amount: (transaction as any)?.amount,
          },
        })
      }

      const paymentLink = await payos.paymentRequests.get(orderCode)
      if (paymentLink.status !== 'PAID') {
        throw new Error(`Payment not completed. Current status: ${paymentLink.status}`)
      }

      const shippingType =
        (transaction.shippingAddress as any)?.pickupDate ||
        (transaction.shippingAddress as any)?.pickupTime
          ? 'pickup'
          : 'delivery'

      const order = await payload.create({
        collection: ordersSlug as any,
        data: {
          amount: transaction.amount,
          currency: transaction.currency || 'VND',
          ...(req.user ? { customer: req.user.id } : { customerEmail }),
          items: transaction.items,
          shippingAddress: transaction.shippingAddress,
          shippingType,
          status: 'processing',
          giftMessage: (transaction as any)?.giftMessage,
          orderNotes: (transaction as any)?.orderNotes,
          taxAmount: transaction.taxAmount ?? 0,
          taxRates: transaction.taxRates ?? [],
          shippingFee: (transaction as any)?.shippingFee ?? 0,
          transactions: [transaction.id],
        } as any,
      })

      const cartID = transaction.cart
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
          payos: {
            ...(transaction.payos || {}),
            status: paymentLink.status,
          },
        } as any,
      })

      return {
        message: 'Order confirmed successfully',
        orderID: order.id,
        transactionID: transaction.id,
      }
    },
  }
}

export const payosAdapterClient = (props?: PaymentAdapterClientArgs): PaymentAdapterClient => {
  return {
    name: 'payos',
    label: props?.label || 'PayOS',
    initiatePayment: true,
    confirmOrder: true,
  }
}
