import type { CollectionBeforeChangeHook } from 'payload'
import type { UserLevel } from '@/config/userLevels'

interface VoucherDoc {
  id: number | string
  code: string
  type: 'percent' | 'fixed'
  value: number
  maxDiscount?: number | null
  scope: 'all' | 'specific'
  applicableProducts?: (number | string)[]
  assignMode: 'all' | 'level' | 'users'
  allowedUserLevels?: string[]
  assignedUsers?: (number | string | { id: number | string })[]
  maxUses?: number | null
  maxUsesPerUser?: number | null
  usedCount?: number | null
  minOrderAmount?: number | null
  validFrom?: string | null
  validTo?: string | null
  _status?: string
}

/**
 * Cart beforeChange hook — runs AFTER the plugin's subtotal calculation.
 *
 * 1. Stores originalSubtotal (base price before any discounts)
 * 2. Re-validates the applied voucher (still published, not expired, etc.)
 * 3. Calculates level discount from UserLevelSettings
 * 4. Subtracts both discounts from subtotal
 *
 * If voucher is no longer valid, auto-removes it from the cart.
 */
export const applyCartDiscounts: CollectionBeforeChangeHook = async ({ data, req }) => {
  // At this point, the plugin's hook has already set data.subtotal from item prices
  const baseSubtotal = data.subtotal ?? 0
  data.originalSubtotal = baseSubtotal

  let voucherDiscount = 0
  let levelDiscount = 0

  // --- Voucher discount ---
  if (data.appliedVoucher) {
    const voucherId =
      typeof data.appliedVoucher === 'object' && data.appliedVoucher !== null
        ? data.appliedVoucher.id
        : data.appliedVoucher

    try {
      const voucher = (await req.payload.findByID({
        collection: 'vouchers',
        id: voucherId,
        depth: 0,
        overrideAccess: true,
        req,
      })) as unknown as VoucherDoc

      const now = new Date()
      const isPublished = voucher._status === 'published'
      const isNotExpired = !voucher.validTo || new Date(voucher.validTo) > now
      const isStarted = !voucher.validFrom || new Date(voucher.validFrom) <= now
      const withinUsageLimit =
        voucher.maxUses == null || (voucher.usedCount ?? 0) < voucher.maxUses
      const meetsMinOrder =
        voucher.minOrderAmount == null || baseSubtotal >= voucher.minOrderAmount

      if (!isPublished || !isNotExpired || !isStarted || !withinUsageLimit || !meetsMinOrder) {
        data.appliedVoucher = null
        data.voucherCode = null
        data.voucherDiscount = 0
      } else {
        // For scope:specific, only discount eligible items' subtotal
        let discountBase = baseSubtotal
        if (voucher.scope === 'specific' && voucher.applicableProducts?.length) {
          const applicableIds = voucher.applicableProducts.map((p) =>
            String(typeof p === 'object' ? (p as any).id : p),
          )
          const items = (data.items || []) as Array<{
            product: number | string | { id: number | string }
            quantity: number
            priceInUSD?: number
          }>
          discountBase = items.reduce((sum, item) => {
            const pid = String(typeof item.product === 'object' ? item.product.id : item.product)
            if (applicableIds.includes(pid)) {
              return sum + (item.priceInUSD ?? 0) * (item.quantity ?? 1)
            }
            return sum
          }, 0)
        }

        if (voucher.type === 'percent') {
          voucherDiscount = (discountBase * (voucher.value ?? 0)) / 100
          if (voucher.maxDiscount != null && voucherDiscount > voucher.maxDiscount) {
            voucherDiscount = voucher.maxDiscount
          }
        } else {
          voucherDiscount = Math.min(voucher.value ?? 0, discountBase)
        }

        voucherDiscount = Math.round(voucherDiscount * 100) / 100
        data.voucherDiscount = voucherDiscount
      }
    } catch {
      // Voucher not found — remove
      data.appliedVoucher = null
      data.voucherCode = null
      data.voucherDiscount = 0
    }
  } else {
    data.voucherDiscount = 0
    data.voucherCode = data.voucherCode ?? null
  }

  // --- Level discount ---
  const customerId =
    typeof data.customer === 'object' && data.customer !== null ? data.customer.id : data.customer

  if (customerId) {
    try {
      const user = await req.payload.findByID({
        collection: 'users',
        id: customerId,
        depth: 0,
        select: { level: true },
        overrideAccess: true,
        req,
      })

      const userLevel = (user.level as UserLevel) || 'bronze'

      const settings = await req.payload.findGlobal({
        slug: 'user-level-settings',
        req,
      })

      const levels = (settings?.levels as Array<{
        level: string
        discountPercent: number
      }>) || []

      const match = levels.find((l) => l.level === userLevel)
      if (match && match.discountPercent > 0) {
        levelDiscount = (baseSubtotal * match.discountPercent) / 100
        levelDiscount = Math.round(levelDiscount * 100) / 100
      }
    } catch {
      // If we can't fetch user level, skip level discount
    }
  }

  data.levelDiscount = levelDiscount

  // --- Apply discounts to subtotal (cap combined discounts at baseSubtotal) ---
  const totalDiscount = Math.min(voucherDiscount + levelDiscount, baseSubtotal)
  if (totalDiscount < voucherDiscount + levelDiscount) {
    // Pro-rate: reduce level discount first since voucher was explicitly applied
    data.levelDiscount = Math.max(0, Math.round((totalDiscount - voucherDiscount) * 100) / 100)
  }
  data.subtotal = Math.max(0, Math.round((baseSubtotal - totalDiscount) * 100) / 100)

  return data
}
