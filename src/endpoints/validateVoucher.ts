import type { Endpoint } from 'payload'
import { APIError } from 'payload'
import type { UserLevel } from '@/config/userLevels'

interface ValidateVoucherBody {
  code: string
  orderSubtotal?: number
  productIds?: (number | string)[]
}

/**
 * POST /api/vouchers/validate
 *
 * Validates a voucher code for the authenticated user.
 * Returns discount info if valid, or an error explaining why not.
 *
 * Body: { code: string, orderSubtotal?: number, productIds?: string[] }
 */
export const validateVoucher: Endpoint = {
  path: '/vouchers/validate',
  method: 'post',
  handler: async (req) => {
    if (!req.user) {
      throw new APIError('Authentication required.', 401)
    }

    const body = (await req.json?.()) as ValidateVoucherBody | undefined

    if (!body?.code) {
      throw new APIError('Voucher code is required.', 400)
    }

    const code = body.code.toUpperCase().trim()
    const orderSubtotal = body.orderSubtotal ?? 0
    const productIds = body.productIds ?? []

    // 1. Find published voucher by code
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
      return Response.json(
        { valid: false, error: 'Invalid or inactive voucher code.' },
        { status: 400 },
      )
    }

    const voucher = vouchers[0]
    const now = new Date()

    // 2. Check date validity
    if (voucher.validFrom && new Date(voucher.validFrom) > now) {
      return Response.json(
        { valid: false, error: 'This voucher is not yet active.' },
        { status: 400 },
      )
    }

    if (voucher.validTo && new Date(voucher.validTo) < now) {
      return Response.json({ valid: false, error: 'This voucher has expired.' }, { status: 400 })
    }

    // 3. Check global usage limit
    if (voucher.maxUses != null && (voucher.usedCount ?? 0) >= voucher.maxUses) {
      return Response.json(
        { valid: false, error: 'This voucher has reached its usage limit.' },
        { status: 400 },
      )
    }

    // 4. Check per-user usage limit
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
          { valid: false, error: 'You have already used this voucher the maximum number of times.' },
          { status: 400 },
        )
      }
    }

    // 5. Check assign mode (who can use)
    if (voucher.assignMode === 'level') {
      const userLevel = (req.user.level as UserLevel) || 'bronze'
      const allowedLevels = (voucher.allowedUserLevels as string[]) || []
      if (!allowedLevels.includes(userLevel)) {
        return Response.json(
          { valid: false, error: 'This voucher is not available for your membership level.' },
          { status: 400 },
        )
      }
    }

    if (voucher.assignMode === 'users') {
      const assignedUsers = (voucher.assignedUsers as (number | string)[]) || []
      const assignedIds = assignedUsers.map((u) => (typeof u === 'object' ? (u as any).id : u))
      if (!assignedIds.includes(req.user.id)) {
        return Response.json(
          { valid: false, error: 'This voucher is not assigned to your account.' },
          { status: 400 },
        )
      }
    }

    // 6. Check minimum order amount
    if (voucher.minOrderAmount != null && orderSubtotal < voucher.minOrderAmount) {
      return Response.json(
        {
          valid: false,
          error: `Minimum order of $${voucher.minOrderAmount.toFixed(2)} required.`,
        },
        { status: 400 },
      )
    }

    // 7. Calculate discount amount
    let discountableSubtotal = Math.max(0, orderSubtotal)

    if (voucher.scope === 'specific' && productIds.length > 0) {
      const applicableIds = ((voucher.applicableProducts as (number | string)[]) || []).map((p) =>
        String(typeof p === 'object' ? (p as any).id : p),
      )

      const matchingIds = productIds.filter((pid) =>
        applicableIds.includes(String(pid)),
      )

      if (matchingIds.length === 0) {
        return Response.json(
          { valid: false, error: 'None of your cart items are eligible for this voucher.' },
          { status: 400 },
        )
      }

      // For specific scope, note that exact eligible-item subtotal is calculated
      // in the cart hook. Here we return a preview based on full subtotal, with a
      // flag so the frontend can show "discount applies to eligible items only".
    }

    let discountAmount = 0

    if (voucher.type === 'percent') {
      discountAmount = (discountableSubtotal * (voucher.value ?? 0)) / 100
      if (voucher.maxDiscount != null && discountAmount > voucher.maxDiscount) {
        discountAmount = voucher.maxDiscount
      }
    } else {
      discountAmount = Math.min(voucher.value ?? 0, discountableSubtotal)
    }

    discountAmount = Math.round(discountAmount * 100) / 100

    return Response.json({
      valid: true,
      voucher: {
        id: voucher.id,
        code: voucher.code,
        type: voucher.type,
        value: voucher.value,
        maxDiscount: voucher.maxDiscount,
        scope: voucher.scope,
        applicableProducts: voucher.applicableProducts,
      },
      discountAmount,
    })
  },
}
