import type { UserLevel } from '@/config/userLevels'
import type { CollectionBeforeChangeHook } from 'payload'

interface VoucherDoc {
  id: number | string
  code: string
  type: 'percent' | 'fixed'
  value: number // Raw VND from DB (e.g. 10000 for 10.000 VND or 20 for 20%)
  maxDiscount?: number | null // Raw VND from DB
  scope: 'all' | 'specific'
  applicableProducts?: (number | string)[]
  assignMode: 'all' | 'level' | 'users'
  allowedUserLevels?: string[]
  assignedUsers?: (number | string | { id: number | string })[]
  maxUses?: number | null
  maxUsesPerUser?: number | null
  usedCount?: number | null
  minOrderAmount?: number | null // Raw VND from DB
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
 * IMPORTANT: With VND currency (decimals: 0), priceInVND is stored as-is.
 * No conversion needed — values are used directly.
 *
 * Sale prices, voucher values, minOrderAmount, etc. are stored as plain VND
 * in our custom fields — no conversion needed.
 */
export const applyCartDiscounts: CollectionBeforeChangeHook = async ({ data, req }) => {
  const items = (data.items || []) as CartItem[]

  // --- Build a PRICE CACHE ---
  const salePriceMap = new Map<string, number>()
  const productPriceMap = new Map<string, number>()
  const variantPriceMap = new Map<string, number>()

  if (items.length > 0) {
    const productIdsToFetch = new Set<string>()
    const variantIdsToFetch = new Set<string>()

    // 1. Fetch active sales (salePrice is plain VND — no conversion)
    const allProductIds = items.map((item) => extractId(item.product))
    try {
      const { docs: activeSales } = await req.payload.find({
        collection: 'sale-events',
        where: {
          and: [{ product: { in: [...new Set(allProductIds)] } }, { status: { equals: 'active' } }],
        },
        limit: 100,
        depth: 0,
        overrideAccess: true,
        req,
      })

      for (const sale of activeSales) {
        const pid = extractId(sale.product as number | string | { id: number | string })
        if (!salePriceMap.has(pid) && sale.salePrice != null) {
          // salePrice is a plain VND field — no conversion needed
          salePriceMap.set(pid, sale.salePrice as number)
        }
      }
    } catch {
      /* fallback */
    }

    // 2. Determine missing prices
    for (const item of items) {
      const pid = extractId(item.product)
      if (!salePriceMap.has(pid)) {
        if (item.variant) variantIdsToFetch.add(extractId(item.variant))
        else productIdsToFetch.add(pid)
      }
    }

    // 3. Fetch product prices (priceInVND is stored as-is)
    if (productIdsToFetch.size > 0) {
      try {
        const uniqueProductIds = Array.from(productIdsToFetch)
        const { docs: productDocs } = await req.payload.find({
          collection: 'products',
          where: { id: { in: uniqueProductIds } },
          limit: uniqueProductIds.length,
          depth: 0,
          select: { priceInVND: true },
          overrideAccess: true,
          req,
        })
        for (const doc of productDocs) {
          productPriceMap.set(String(doc.id), doc.priceInVND ?? 0)
        }
      } catch {
        /* fallback */
      }
    }

    // 4. Fetch variant prices (priceInVND is stored as-is)
    if (variantIdsToFetch.size > 0) {
      try {
        const uniqueVariantIds = Array.from(variantIdsToFetch)
        const { docs: variantDocs } = await req.payload.find({
          collection: 'variants' as 'users', // Cast for plugin-specific collections
          where: { id: { in: uniqueVariantIds } },
          limit: uniqueVariantIds.length,
          depth: 0,
          overrideAccess: true,
          req,
        })
        for (const doc of variantDocs) {
          const price = (doc as unknown as { priceInVND?: number }).priceInVND ?? 0
          variantPriceMap.set(String(doc.id), price)
        }
      } catch {
        /* fallback */
      }
    }

    // Helper to resolve the correct price (returns VND)
    const getItemPrice = (item: CartItem): number => {
      const pid = extractId(item.product)
      if (salePriceMap.has(pid)) return salePriceMap.get(pid)!

      if (item.variant) {
        const vid = extractId(item.variant)
        return variantPriceMap.get(vid) ?? 0
      }

      return productPriceMap.get(pid) ?? 0
    }

    // Recalculate subtotal
    let adjustedSubtotal = 0
    for (const item of items) {
      const price = getItemPrice(item)
      adjustedSubtotal += price * (item.quantity ?? 1)
    }

    data.subtotal = adjustedSubtotal
    data.originalSubtotal = adjustedSubtotal
  } else {
    data.subtotal = 0
    data.originalSubtotal = 0
  }

  const baseSubtotal = data.originalSubtotal as number

  let voucherDiscount = 0
  let levelDiscount = 0

  // --- Voucher calculation ---
  if (data.appliedVoucher) {
    const voucherId = extractId(data.appliedVoucher)

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

      // minOrderAmount is plain VND — no conversion
      const minOrder = voucher.minOrderAmount ?? 0
      const meetsMinOrder = voucher.minOrderAmount == null || baseSubtotal >= minOrder

      if (!isPublished || !isNotExpired || !isStarted || !withinUsageLimit || !meetsMinOrder) {
        data.appliedVoucher = null
        data.voucherCode = null
        data.voucherDiscount = 0
      } else {
        let discountBase = baseSubtotal
        let isVoided = false

        if (voucher.scope === 'specific' && voucher.applicableProducts?.length) {
          const applicableIds = voucher.applicableProducts.map((p) => extractId(p))
          let eligibleSubtotal = 0

          for (const item of items) {
            const pid = extractId(item.product)
            if (!applicableIds.includes(pid)) continue

            const pidSale = extractId(item.product)
            const price = salePriceMap.has(pidSale)
              ? salePriceMap.get(pidSale)!
              : item.variant
                ? (variantPriceMap.get(extractId(item.variant)) ?? 0)
                : (productPriceMap.get(pid) ?? 0)

            eligibleSubtotal += price * (item.quantity ?? 1)
          }

          if (eligibleSubtotal === 0) isVoided = true
          else discountBase = eligibleSubtotal
        }

        if (isVoided) {
          data.appliedVoucher = null
          data.voucherCode = null
          data.voucherDiscount = 0
        } else {
          if (voucher.type === 'percent') {
            voucherDiscount = Math.floor((discountBase * (voucher.value ?? 0)) / 100)
            // maxDiscount is plain VND — no conversion
            const maxDiscount = voucher.maxDiscount ?? 0
            if (voucher.maxDiscount != null && voucherDiscount > maxDiscount) {
              voucherDiscount = maxDiscount
            }
          } else {
            // fixed value is plain VND — no conversion
            const fixedDiscount = voucher.value ?? 0
            voucherDiscount = Math.min(fixedDiscount, discountBase)
          }

          data.voucherDiscount = voucherDiscount
        }
      }
    } catch {
      data.appliedVoucher = null
      data.voucherCode = null
      data.voucherDiscount = 0
    }
  } else {
    data.voucherDiscount = 0
  }

  // --- Level discount calculation ---
  const customerId = extractId(data.customer)
  if (customerId && customerId !== 'null' && customerId !== 'undefined') {
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
      const settings = await req.payload.findGlobal({ slug: 'user-level-settings', req })
      const levels = (settings?.levels as Array<{ level: string; discountPercent: number }>) || []

      const match = levels.find((l) => l.level === userLevel)
      if (match && match.discountPercent > 0) {
        levelDiscount = Math.floor((baseSubtotal * match.discountPercent) / 100)
      }
    } catch {
      /* skip */
    }
  }

  data.levelDiscount = levelDiscount

  // --- Final application ---
  const totalDiscount = Math.min(voucherDiscount + levelDiscount, baseSubtotal)

  // Pro-rate level discount if combined exceeds subtotal
  if (totalDiscount < voucherDiscount + levelDiscount) {
    data.levelDiscount = Math.max(0, totalDiscount - voucherDiscount)
  }

  data.subtotal = Math.max(0, baseSubtotal - totalDiscount)

  return data
}
