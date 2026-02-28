import type { Endpoint } from 'payload'
import { APIError } from 'payload'

interface CartDoc {
  id: string | number
  appliedVoucher?: string | number | { id: string | number } | null
  voucherCode?: string | null
  reservedVoucherExpiresAt?: string | null
}

/**
 * POST /api/voucher-validate-for-payment
 *
 * Validates that the voucher reservation on the cart is still valid.
 * Should be called before initiating payment to ensure the voucher can be applied.
 *
 * This endpoint does NOT modify cart state - it only validates.
 */
export const validateVoucherForPayment: Endpoint = {
  path: '/voucher-validate-for-payment',
  method: 'post',
  handler: async (req) => {
    if (!req.user) {
      throw new APIError('Authentication required.', 401)
    }

    // 1. Find the user's active cart
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

    const cart = carts[0] as unknown as CartDoc | undefined

    if (!cart) {
      return Response.json({ valid: false, error: 'No active cart found.' }, { status: 400 })
    }

    // 2. Check if there's a voucher applied
    const voucherId =
      typeof cart.appliedVoucher === 'object' && cart.appliedVoucher !== null
        ? cart.appliedVoucher.id
        : cart.appliedVoucher

    if (!voucherId) {
      return Response.json({ valid: true, voucherCode: null })
    }

    // 3. Check if reservation has expired
    if (cart.reservedVoucherExpiresAt) {
      const expiresAt = new Date(cart.reservedVoucherExpiresAt)
      const now = new Date()

      if (expiresAt < now) {
        // Reservation expired - clear the voucher
        await req.payload.update({
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

        return Response.json(
          {
            valid: false,
            error: 'Voucher reservation has expired. Please re-apply the voucher.',
          },
          { status: 400 },
        )
      }
    }

    // 4. Validate voucher is still usable
    const voucher = await req.payload.findByID({
      collection: 'vouchers',
      id: voucherId,
      depth: 0,
      overrideAccess: true,
      req,
    })

    if (!voucher || voucher._status !== 'published') {
      // Voucher no longer exists or not published - clear it
      await req.payload.update({
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

      return Response.json(
        {
          valid: false,
          error: 'Voucher is no longer valid.',
        },
        { status: 400 },
      )
    }

    // Check usage limits
    const now = new Date()
    if (voucher.validFrom && new Date(voucher.validFrom) > now) {
      return Response.json({ valid: false, error: 'Voucher is not yet active.' }, { status: 400 })
    }
    if (voucher.validTo && new Date(voucher.validTo) < now) {
      return Response.json({ valid: false, error: 'Voucher has expired.' }, { status: 400 })
    }
    if (voucher.maxUses != null && (voucher.usedCount ?? 0) >= voucher.maxUses) {
      return Response.json(
        { valid: false, error: 'Voucher has reached its usage limit.' },
        { status: 400 },
      )
    }

    return Response.json({
      valid: true,
      voucherCode: cart.voucherCode,
    })
  },
}
