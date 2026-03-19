import type {
  PaymentAdapter,
  PaymentAdapterArgs,
  PaymentAdapterClient,
  PaymentAdapterClientArgs,
} from '@payloadcms/plugin-ecommerce/types'
import type { Address } from '@/payload-types'
import type { GroupField } from 'payload'

type CodAdapterArgs = {
  transactionsSlug?: string
} & PaymentAdapterArgs

export const codAdapter = (_props: CodAdapterArgs): PaymentAdapter => {
  const label = _props?.label || 'Cash on Delivery'

  const groupField: GroupField = {
    name: 'cod',
    type: 'group',
    admin: {
      condition: (data: any) => {
        const path = 'paymentMethod'
        return data?.[path] === 'cod'
      },
    },
    fields: [],
  }

  return {
    name: 'cod',
    label,
    group: groupField,

    initiatePayment: async ({ data, req, transactionsSlug }) => {
      const payload = req.payload

      const { cart, currency, customerEmail, billingAddress, shippingAddress } = data as any
      if (!currency) throw new Error('Currency is required.')
      if (!cart || !cart.items || cart.items.length === 0) throw new Error('Cart is empty.')
      if (!customerEmail || typeof customerEmail !== 'string')
        throw new Error('A valid customer email is required to make a purchase.')

      // Notes / pricing from checkout UI:
      // plugin-ecommerce passes a subset into the adapter `data` param, but the full
      // request body still contains our `additionalData`.
      //
      // In practice, `req.data` may be sanitized to the subset, so we should merge from
      // both `req.data` and `req.body` to reliably read `giftMessage/orderNotes`.
      const reqAny = req as any
      const root = {
        ...(reqAny?.data ?? {}),
        ...(reqAny?.body ?? {}),
        ...(reqAny?.req?.body ?? {}),
      } as Record<string, unknown>

      // plugin-ecommerce may nest our payload under `additionalData`.
      // Also, we embed some fields into billing/shipping address objects
      // so they remain available regardless of request shaping.
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

      // Prefer non-zero taxAmount if available. (root can sometimes carry a default `0`.)
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
      // Prefer non-empty taxRates if available. (root can be `[]`.)
      const taxRates = parsedTaxRatesArrays.find((arr) => arr.length > 0) ?? parsedTaxRatesArrays[0] ?? []

      const orderTotalRaw =
        additionalData?.orderTotal ?? root?.orderTotal ?? root?.totalAmount ?? (billingAddress as any)?.orderTotal
      const orderTotal =
        typeof orderTotalRaw === 'number'
          ? orderTotalRaw
          : typeof orderTotalRaw === 'string'
            ? Number(orderTotalRaw)
            : NaN

      const shippingFeeRaw =
        additionalData?.shippingFee ?? root?.shippingFee ?? (billingAddress as any)?.shippingFee
      const shippingFee =
        typeof shippingFeeRaw === 'number'
          ? shippingFeeRaw
          : typeof shippingFeeRaw === 'string'
            ? Number(shippingFeeRaw)
            : NaN

      const amount = Number.isFinite(orderTotal) ? orderTotal : (cart.subtotal as number)

      const debugPayment = process.env.PAYMENT_DEBUG === '1'
      if (debugPayment) {
        const preview = (v: unknown) => {
          if (v === undefined) return undefined
          if (v === null) return null
          if (typeof v === 'string') return v.slice(0, 200)
          try {
            return JSON.stringify(v).slice(0, 200)
          } catch {
            return '[unserializable]'
          }
        }
        console.log('[PAYMENT_DEBUG][cod][initiate]', {
          giftMessage,
          orderNotes,
          taxAmount,
          taxRatesCount: Array.isArray(taxRates) ? taxRates.length : 0,
          shippingFee,
          orderTotal: Number.isFinite(orderTotal) ? orderTotal : undefined,
          amount,
          currency,
          customerEmail,
          cartId: cart.id,
          debugSources: {
            additionalDataGiftMessageType: typeof (additionalData as any)?.giftMessage,
            rootGiftMessageType: typeof (root as any)?.giftMessage,
            billingGiftMessageType: typeof (billingAddress as any)?.giftMessage,
            shippingGiftMessageType: typeof (shippingAddress as any)?.giftMessage,
            additionalDataTaxAmountType: typeof (additionalData as any)?.taxAmount,
            rootTaxAmountType: typeof (root as any)?.taxAmount,
            additionalDataTaxRatesType: typeof (additionalData as any)?.taxRates,
            additionalDataTaxRatesPreview: preview((additionalData as any)?.taxRates),
            rootTaxRatesType: typeof (root as any)?.taxRates,
            rootTaxRatesPreview: preview((root as any)?.taxRates),
            additionalDataShippingFeeType: typeof (additionalData as any)?.shippingFee,
            rootShippingFeeType: typeof (root as any)?.shippingFee,
          },
        })
      }
      const shippingType =
        (shippingAddress as any)?.pickupDate || (shippingAddress as any)?.pickupTime
          ? 'pickup'
          : 'delivery'

      const flattenedCart = cart.items.map((item: any) => {
        const productID = typeof item.product === 'object' ? item.product.id : item.product
        const variantID = item.variant
          ? typeof item.variant === 'object'
            ? item.variant.id
            : item.variant
          : undefined

        // IMPORTANT:
        // `cart.items` can contain an `id` that is unique per cart item, but
        // `transactions_items.id` is unique globally. If we pass the `id` through,
        // retrying COD can crash with "UNIQUE constraint failed: transactions_items.id".
        const { product: _product, variant: _variant, id: _id, ...customProperties } = item as any

        return {
          ...customProperties,
          product: productID,
          quantity: item.quantity,
          ...(variantID ? { variant: variantID } : {}),
        }
      })

      // Create a transaction record first (so the admin can track it).
      const transaction = await payload.create({
        collection: transactionsSlug as any,
        data: {
          ...(req.user
            ? { customer: req.user.id, customerEmail: (req.user as any)?.email ?? customerEmail }
            : { customerEmail }),
          amount,
          billingAddress,
          cart: cart.id,
          currency,
          items: flattenedCart,
          paymentMethod: 'cod',
          status: 'succeeded',
          giftMessage,
          orderNotes,
          taxAmount,
          taxRates,
        } as any,
      })

      const order = await payload.create({
        collection: 'orders' as any,
        data: {
          amount: transaction.amount,
          currency: transaction.currency || currency,
          ...(req.user
            ? { customer: req.user.id, customerEmail: (req.user as any)?.email ?? customerEmail }
            : { customerEmail }),
          items: transaction.items,
          shippingAddress: shippingAddress as Partial<Address>,
          shippingType,
          status: 'processing',
          transactions: [transaction.id],
          giftMessage,
          orderNotes,
          taxAmount,
          taxRates,
          shippingFee: Number.isFinite(shippingFee) ? shippingFee : 0,
        } as any,
      })

      if (process.env.PAYMENT_DEBUG === '1') {
        console.log('[PAYMENT_DEBUG][cod][afterCreate]', {
          transaction: {
            id: transaction.id,
            giftMessage: (transaction as any)?.giftMessage,
            orderNotes: (transaction as any)?.orderNotes,
            taxAmount: (transaction as any)?.taxAmount,
            taxRatesCount: Array.isArray((transaction as any)?.taxRates)
              ? (transaction as any)?.taxRates.length
              : (transaction as any)?.taxRates && typeof (transaction as any)?.taxRates === 'object'
                ? Object.keys((transaction as any)?.taxRates).length
                : 0,
            shippingFee: (transaction as any)?.shippingFee,
          },
          order: {
            id: order.id,
            giftMessage: (order as any)?.giftMessage,
            orderNotes: (order as any)?.orderNotes,
            taxAmount: (order as any)?.taxAmount,
            taxRatesCount: Array.isArray((order as any)?.taxRates)
              ? (order as any)?.taxRates.length
              : (order as any)?.taxRates && typeof (order as any)?.taxRates === 'object'
                ? Object.keys((order as any)?.taxRates).length
                : 0,
            shippingFee: (order as any)?.shippingFee,
          },
        })
      }

      // Link transaction -> order + mark succeeded
      await payload.update({
        id: transaction.id,
        collection: transactionsSlug as any,
        data: {
          order: order.id,
          status: 'succeeded',
        } as any,
      })

      // Mark cart purchasedAt
      await payload.update({
        id: cart.id,
        collection: 'carts' as any,
        data: { purchasedAt: new Date().toISOString() } as any,
        overrideAccess: true,
        req,
      })

      return {
        message: 'COD order created successfully',
        orderID: order.id,
        transactionID: transaction.id,
        accessToken: (order as any)?.accessToken,
      }
    },

    // COD completes the order in initiatePayment, so confirm-order isn't used.
    confirmOrder: async () => {
      throw new Error('COD confirm-order is not supported.')
    },
  }
}

export const codAdapterClient = (props?: PaymentAdapterClientArgs): PaymentAdapterClient => {
  return {
    name: 'cod',
    label: props?.label || 'Cash on Delivery (COD)',
    initiatePayment: true,
    confirmOrder: false,
  }
}
