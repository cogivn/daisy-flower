import type { Endpoint } from 'payload'
import { APIError } from 'payload'

/**
 * POST /api/voucher-remove
 *
 * Removes the applied voucher from the authenticated user's active cart.
 * The cart's beforeChange hook will recalculate subtotal without discount.
 */
export const removeVoucherFromCart: Endpoint = {
  path: '/voucher-remove',
  method: 'post',
  handler: async (req) => {
    if (!req.user) {
      throw new APIError('Authentication required.', 401)
    }

    const { docs: carts } = await req.payload.find({
      collection: 'carts',
      where: {
        and: [{ customer: { equals: req.user.id } }, { purchasedAt: { exists: false } }],
      },
      sort: '-updatedAt',
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req,
    })

    const cart = carts[0]

    if (!cart) {
      return Response.json({ error: 'No active cart found.' }, { status: 400 })
    }

    interface CartDoc {
      id: string | number
      subtotal?: number
      originalSubtotal?: number
      voucherCode?: string | null
      voucherDiscount?: number | null
      levelDiscount?: number | null
    }

    const updatedCart = await req.payload.update({
      collection: 'carts' as never,
      id: cart.id,
      data: {
        appliedVoucher: null,
        voucherCode: null,
        voucherDiscount: 0,
        reservedVoucherExpiresAt: null,
      } as never,
      depth: 0,
      overrideAccess: true,
      req,
    })

    const result = updatedCart as unknown as CartDoc

    return Response.json({
      success: true,
      cart: {
        id: result.id,
        originalSubtotal: result.originalSubtotal,
        voucherCode: null,
        voucherDiscount: 0,
        levelDiscount: result.levelDiscount,
        subtotal: result.subtotal,
      },
    })
  },
}
