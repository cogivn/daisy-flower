import type { UserLevel } from '@/config/userLevels'
import type { Endpoint } from 'payload'
import { APIError } from 'payload'

interface ApplyVoucherBody {
  code: string
}

interface CartItem {
  product: string | number | { id: string | number }
}

interface CartDoc {
  id: string | number
  subtotal?: number
  originalSubtotal?: number
  voucherCode?: string | null
  voucherDiscount?: number | null
  levelDiscount?: number | null
  items?: CartItem[]
}

/**
 * POST /api/voucher-apply
 *
 * Validates a voucher and applies it to the authenticated user's active cart.
 * The cart's beforeChange hook will recalculate subtotal with discount on next save.
 *
 * Body: { code: string }
 */
export const applyVoucherToCart: Endpoint = {
  path: '/voucher-apply',
  method: 'post',
  handler: async (req) => {
    if (!req.user) {
      throw new APIError('Authentication required.', 401)
    }

    const body = (await req.json?.()) as ApplyVoucherBody | undefined

    if (!body?.code) {
      throw new APIError('Voucher code is required.', 400)
    }

    const code = body.code.toUpperCase().trim()

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
      return Response.json({ error: 'No active cart found.' }, { status: 400 })
    }

    // 2. Find published voucher by code
    const { docs: vouchers } = await req.payload.find({
      collection: 'vouchers',
      where: {
        code: { equals: code },
        _status: { equals: 'published' },
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req,
    })

    if (vouchers.length === 0) {
      return Response.json({ error: 'Invalid or inactive voucher code.' }, { status: 400 })
    }

    const voucher = vouchers[0]
    const now = new Date()

    // 3. Validate dates
    if (voucher.validFrom && new Date(voucher.validFrom) > now) {
      return Response.json({ error: 'This voucher is not yet active.' }, { status: 400 })
    }
    if (voucher.validTo && new Date(voucher.validTo) < now) {
      return Response.json({ error: 'This voucher has expired.' }, { status: 400 })
    }

    // 4. Check global usage
    if (voucher.maxUses != null && (voucher.usedCount ?? 0) >= voucher.maxUses) {
      return Response.json({ error: 'This voucher has reached its usage limit.' }, { status: 400 })
    }

    // 5. Check per-user usage
    if (voucher.maxUsesPerUser != null) {
      const { totalDocs: userUsageCount } = await req.payload.find({
        collection: 'orders',
        where: {
          and: [
            { voucher: { equals: voucher.id } },
            { customer: { equals: req.user.id } },
            { status: { not_equals: 'cancelled' } },
          ],
        },
        limit: 0,
        pagination: false,
        overrideAccess: true,
        req,
      })

      if (userUsageCount >= voucher.maxUsesPerUser) {
        return Response.json(
          { error: 'You have already used this voucher the maximum number of times.' },
          { status: 400 },
        )
      }
    }

    // 6. Check assign mode
    if (voucher.assignMode === 'level') {
      const userLevel = (req.user.level as UserLevel) || 'bronze'
      const allowedLevels = (voucher.allowedUserLevels as string[]) || []
      if (!allowedLevels.includes(userLevel)) {
        return Response.json(
          { error: 'This voucher is not available for your membership level.' },
          { status: 400 },
        )
      }
    }

    if (voucher.assignMode === 'users') {
      const assignedUsers = (voucher.assignedUsers as (number | string)[]) || []
      const assignedIds = assignedUsers.map((u) =>
        typeof u === 'object' ? String((u as { id: string | number }).id) : String(u),
      )
      if (!assignedIds.includes(String(req.user.id))) {
        return Response.json(
          { error: 'This voucher is not assigned to your account.' },
          { status: 400 },
        )
      }
    }

    // 7. Check min order amount
    const cartSubtotal = cart.originalSubtotal ?? cart.subtotal ?? 0
    if (voucher.minOrderAmount != null && cartSubtotal < voucher.minOrderAmount) {
      return Response.json(
        { error: `Minimum order of $${(voucher.minOrderAmount / 100).toFixed(2)} required.` },
        { status: 400 },
      )
    }

    // 8. Check product scope
    if (voucher.scope === 'specific') {
      const applicableIds = ((voucher.applicableProducts as (number | string)[]) || []).map((p) =>
        typeof p === 'object' ? String((p as { id: string | number }).id) : String(p),
      )
      const cartItems = cart.items || []
      const hasMatch = cartItems.some((item) => {
        const pid = typeof item.product === 'object' ? item.product.id : item.product
        return applicableIds.some((aid) => String(aid) === String(pid))
      })
      if (!hasMatch) {
        return Response.json(
          { error: 'None of your cart items are eligible for this voucher.' },
          { status: 400 },
        )
      }
    }

    // 9. Apply voucher to cart — beforeChange hook will calculate discounts
    const updatedCart = await req.payload.update({
      collection: 'carts' as never,
      id: cart.id,
      data: {
        appliedVoucher: voucher.id,
        voucherCode: voucher.code,
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
        voucherCode: result.voucherCode,
        voucherDiscount: result.voucherDiscount,
        levelDiscount: result.levelDiscount,
        subtotal: result.subtotal,
      },
    })
  },
}
