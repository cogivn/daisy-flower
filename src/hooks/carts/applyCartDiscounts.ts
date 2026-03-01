import type { UserLevel } from '@/config/userLevels'
import type { CollectionBeforeChangeHook } from 'payload'

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

type CartItem = {
  product: number | string | { id: number | string }
  variant?: number | string | { id: number | string } | null
  quantity: number
}

function extractId(ref: number | string | { id: number | string }): string {
  return String(typeof ref === 'object' ? ref.id : ref)
}

/**
 * Cart beforeChange hook — runs AFTER the plugin's subtotal calculation.
 *
 * 0. Batch-fetches active sale events + product/variant prices (1-2 queries total)
 * 1. Adjusts subtotal for active sale events (plugin uses original prices)
 * 2. Stores originalSubtotal (base price before any discounts)
 * 3. Re-validates the applied voucher (still published, not expired, etc.)
 * 4. Calculates level discount from UserLevelSettings
 * 5. Subtracts both discounts from subtotal
 *
 * If voucher is no longer valid, auto-removes it from the cart.
 */
export const applyCartDiscounts: CollectionBeforeChangeHook = async ({ data, req }) => {
  const items = (data.items || []) as CartItem[]

  // --- Build a price cache for all cart items in minimal queries ---
  const salePriceMap = new Map<string, number>()
  const productPriceMap = new Map<string, number>()
  const variantPriceMap = new Map<string, number>()

  if (items.length > 0) {
    const productIdsToFetch = new Set<string>()
    const variantIdsToFetch = new Set<string>()

    // 1 query: fetch ALL active sale events for cart products
    const allProductIds = items.map((item) => extractId(item.product))
    try {
      const { docs: activeSales } = await req.payload.find({
        collection: 'sale-events',
        where: {
          and: [{ product: { in: [...new Set(allProductIds)] } }, { status: { equals: 'active' } }],
        },
        limit: 100,
        depth: 0,
        sort: '-createdAt',
        overrideAccess: true,
        req,
      })

      // Keep only the most recent sale per product
      for (const sale of activeSales) {
        const pid = extractId(sale.product as number | string | { id: number | string })
        if (!salePriceMap.has(pid) && sale.salePrice != null) {
          salePriceMap.set(pid, sale.salePrice as number)
        }
      }
    } catch {
      // Non-critical: fallback to original prices
    }

    // Determine which items need their original prices looked up
    for (const item of items) {
      const pid = extractId(item.product)
      if (!salePriceMap.has(pid)) {
        if (item.variant) {
          variantIdsToFetch.add(extractId(item.variant))
        } else {
          productIdsToFetch.add(pid)
        }
      }
    }

    // Batch fetch product prices (1 query)
    if (productIdsToFetch.size > 0) {
      try {
        const uniqueProductIds = Array.from(productIdsToFetch)
        const { docs: productDocs } = await req.payload.find({
          collection: 'products',
          where: { id: { in: uniqueProductIds } },
          limit: uniqueProductIds.length,
          depth: 0,
          select: { priceInUSD: true },
          overrideAccess: true,
          req,
        })
        for (const doc of productDocs) {
          productPriceMap.set(String(doc.id), doc.priceInUSD ?? 0)
        }
      } catch {
        // Fallback to 0
      }
    }

    // Batch fetch variant prices (1 query)
    if (variantIdsToFetch.size > 0) {
      try {
        const uniqueVariantIds = Array.from(variantIdsToFetch)
        const { docs: variantDocs } = await req.payload.find({
          collection: 'variants' as 'users',
          where: { id: { in: uniqueVariantIds } },
          limit: uniqueVariantIds.length,
          depth: 0,
          overrideAccess: true,
          req,
        })
        for (const doc of variantDocs) {
          variantPriceMap.set(
            String(doc.id),
            (doc as unknown as { priceInUSD?: number }).priceInUSD ?? 0,
          )
        }
      } catch {
        // Fallback to 0
      }
    }

    // Helper to resolve the correct price for an item
    const getItemPrice = (item: CartItem): number => {
      const pid = extractId(item.product)
      if (salePriceMap.has(pid)) return salePriceMap.get(pid)!

      if (item.variant) {
        const vid = extractId(item.variant)
        return variantPriceMap.get(vid) ?? 0
      }

      return productPriceMap.get(pid) ?? 0
    }

    // Recalculate subtotal using effective prices
    let adjustedSubtotal = 0
    for (const item of items) {
      const price = getItemPrice(item)
      adjustedSubtotal += price * (item.quantity ?? 1)
    }

    // Always overwrite data.subtotal/originalSubtotal with the current base sum of items
    // This prevents reusing stale discounted values between updates.
    data.subtotal = adjustedSubtotal
    data.originalSubtotal = adjustedSubtotal
  } else {
    data.subtotal = 0
    data.originalSubtotal = 0
  }

  const baseSubtotal = data.originalSubtotal

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
      const withinUsageLimit = voucher.maxUses == null || (voucher.usedCount ?? 0) < voucher.maxUses
      const meetsMinOrder =
        voucher.minOrderAmount == null || baseSubtotal >= voucher.minOrderAmount * 100

      if (!isPublished || !isNotExpired || !isStarted || !withinUsageLimit || !meetsMinOrder) {
        data.appliedVoucher = null
        data.voucherCode = null
        data.voucherDiscount = 0
        data.reservedVoucherExpiresAt = null
      } else {
        // For scope:specific, only discount eligible items' subtotal
        let discountBase = baseSubtotal
        let isVoided = false

        if (voucher.scope === 'specific' && voucher.applicableProducts?.length) {
          const applicableIds = voucher.applicableProducts.map((p) =>
            String(typeof p === 'object' ? (p as { id: number | string }).id : p),
          )

          let eligibleSubtotal = 0
          // Only defined if items.length > 0
          const resolver =
            items.length > 0
              ? (item: CartItem) => {
                  const pid = extractId(item.product)
                  if (salePriceMap.has(pid)) return salePriceMap.get(pid)!
                  if (item.variant) {
                    return variantPriceMap.get(extractId(item.variant)) ?? 0
                  }
                  return productPriceMap.get(pid) ?? 0
                }
              : () => 0

          for (const item of items) {
            const pid = extractId(item.product)
            if (!applicableIds.includes(pid)) continue
            const price = resolver(item)
            eligibleSubtotal += price * (item.quantity ?? 1)
          }

          if (eligibleSubtotal === 0) {
            isVoided = true
          } else {
            discountBase = eligibleSubtotal
          }
        }

        if (isVoided) {
          data.appliedVoucher = null
          data.voucherCode = null
          data.voucherDiscount = 0
          data.reservedVoucherExpiresAt = null
        } else {
          if (voucher.type === 'percent') {
            voucherDiscount = Math.floor((discountBase * (voucher.value ?? 0)) / 100)
            const maxDiscountInCents = (voucher.maxDiscount ?? 0) * 100
            if (voucher.maxDiscount != null && voucherDiscount > maxDiscountInCents) {
              voucherDiscount = maxDiscountInCents
            }
          } else {
            voucherDiscount = Math.min((voucher.value ?? 0) * 100, discountBase)
          }

          voucherDiscount = Math.floor(voucherDiscount)
          data.voucherDiscount = voucherDiscount
        }
      }
    } catch {
      // Voucher not found — remove
      data.appliedVoucher = null
      data.voucherCode = null
      data.voucherDiscount = 0
      data.reservedVoucherExpiresAt = null
    }
  } else {
    data.voucherDiscount = 0
    data.voucherCode = data.voucherCode ?? null
    data.reservedVoucherExpiresAt = null
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

      const levels =
        (settings?.levels as Array<{
          level: string
          discountPercent: number
        }>) || []

      const match = levels.find((l) => l.level === userLevel)
      if (match && match.discountPercent > 0) {
        levelDiscount = Math.floor((baseSubtotal * match.discountPercent) / 100)
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
