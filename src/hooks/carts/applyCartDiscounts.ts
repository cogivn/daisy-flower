import type { UserLevel } from '@/config/userLevels'
import type { CollectionBeforeChangeHook } from 'payload'

/* eslint-disable @typescript-eslint/no-explicit-any */

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

function extractId(ref: number | string | { id: number | string } | unknown): string {
  if (!ref) return ''
  return String(typeof ref === 'object' && ref !== null ? (ref as any).id : ref)
}

/**
 * Cart beforeChange hook — recalculates subtotal, applies dynamic discounts
 * from Vouchers / User Levels, AND now mathematically computes Taxes (taxAmount, taxRates)
 * following the fallback hierarchy: Product > Category > Global.
 */
export const applyCartDiscounts: CollectionBeforeChangeHook = async ({
  data,
  req,
  originalDoc,
  ...rest
}) => {
  const original = (originalDoc ?? {}) as any
  // Payload hook types may not expose `id`, but runtime can include it.
  // Try multiple sources because this hook can be called for PATCH `{}`.
  const cartId =
    (rest as any)?.id ??
    original?.id ??
    (req as any)?.routeParams?.id ??
    (req as any)?.params?.id ??
    (req as any)?.req?.params?.id ??
    undefined

  // Payload may call this hook for PATCH requests that do not include `items`.
  // In that case, fallback to the existing cart doc so we don't reset
  // subtotal/tax to 0.
  const items = (Array.isArray(data.items) ? data.items : original.items || []) as CartItem[]
  const debugPayment = process.env.PAYMENT_DEBUG === '1' || process.env.TAX_DEBUG === '1'

  // In some cases Payload's `PATCH {}` passes an `originalDoc` without `items`.
  // If that happens, attempt a lightweight re-fetch for tax calculation.
  let effectiveItems = items
  if (effectiveItems.length === 0 && cartId != null) {
    try {
      const freshCart = await req.payload.findByID({
        collection: 'carts',
        id: cartId as any,
        depth: 0,
        overrideAccess: true,
        req,
        select: {
          items: true,
          appliedVoucher: true,
          voucherCode: true,
          voucherDiscount: true,
          levelDiscount: true,
          originalSubtotal: true,
          taxAmount: true,
          taxRates: true,
          customer: true,
        } as any,
      })

      effectiveItems = (freshCart as any)?.items || []
      if (debugPayment) {
        // eslint-disable-next-line no-console
        console.log('[PAYMENT_DEBUG][cartHook][refetchItems]', {
          cartId,
          originalItemsCount: Array.isArray(items) ? items.length : 0,
          freshItemsCount: effectiveItems.length,
        })
      }

      // Merge voucher/customer fields into `original` so downstream fallback hierarchy works.
      if (freshCart) {
        original.appliedVoucher = original.appliedVoucher ?? (freshCart as any).appliedVoucher
        original.voucherCode = original.voucherCode ?? (freshCart as any).voucherCode
        original.voucherDiscount = original.voucherDiscount ?? (freshCart as any).voucherDiscount
        original.levelDiscount = original.levelDiscount ?? (freshCart as any).levelDiscount
        original.originalSubtotal = original.originalSubtotal ?? (freshCart as any).originalSubtotal
        original.taxAmount = original.taxAmount ?? (freshCart as any).taxAmount
        original.taxRates = original.taxRates ?? (freshCart as any).taxRates
        original.customer = original.customer ?? (freshCart as any).customer
      }
    } catch {
      // ignore refetch failure and fallback to early exit
    }
  }

  // Early exit for empty carts (after refetch attempt)
  if (effectiveItems.length === 0) {
    data.subtotal = 0
    data.originalSubtotal = 0
    data.voucherDiscount = 0
    data.levelDiscount = 0
    data.taxAmount = 0
    data.taxRates = []
    data.appliedVoucher = null
    data.voucherCode = null
    return data
  }

  // --- PHASE 1: Build Unique ID Sets for Concurrent Fetching ---
  const productIdsToFetch = new Set<string>()
  const variantIdsToFetch = new Set<string>()

  for (const item of effectiveItems) {
    const pid = extractId(item.product)
    if (pid) productIdsToFetch.add(pid)

    if (item.variant) {
      const vid = extractId(item.variant)
      if (vid) variantIdsToFetch.add(vid)
    }
  }

  const allProductIds = Array.from(productIdsToFetch)
  const allVariantIds = Array.from(variantIdsToFetch)
  const effectiveAppliedVoucher = data.appliedVoucher ?? original.appliedVoucher
  const effectiveCustomer = data.customer ?? original.customer

  const voucherId = effectiveAppliedVoucher ? extractId(effectiveAppliedVoucher) : null
  const customerId = effectiveCustomer ? extractId(effectiveCustomer) : null

  // --- PHASE 2: Fetch Level 1 Resources Concurrently (depth: 0) ---
  const [salesRes, productsRes, variantsRes, voucherRes, userRes, userSettingsRes, taxSettingsRes] =
    await Promise.all([
      // 1. Sales
      allProductIds.length > 0
        ? req.payload
            .find({
              collection: 'sale-events',
              where: {
                and: [{ product: { in: allProductIds } }, { status: { equals: 'active' } }],
              },
              limit: 100,
              depth: 0,
              overrideAccess: true,
              req,
            })
            .catch(() => ({ docs: [] }))
        : { docs: [] },

      // 2. Products - Explicitly depth 0 to avoid massive nested data queries
      allProductIds.length > 0
        ? req.payload
            .find({
              collection: 'products',
              where: { id: { in: allProductIds } },
              limit: allProductIds.length,
              depth: 0,
              select: { priceInVND: true, taxClasses: true, categories: true },
              overrideAccess: true,
              req,
            })
            .catch(() => ({ docs: [] }))
        : { docs: [] },

      // 3. Variants
      allVariantIds.length > 0
        ? req.payload
            .find({
              collection: 'variants' as any,
              where: { id: { in: allVariantIds } },
              limit: allVariantIds.length,
              depth: 0,
              select: { priceInVND: true },
              overrideAccess: true,
              req,
            })
            .catch(() => ({ docs: [] }))
        : { docs: [] },

      // 4. Voucher
      voucherId
        ? (req.payload
            .findByID({
              collection: 'vouchers',
              id: voucherId,
              depth: 0,
              overrideAccess: true,
              req,
            })
            .catch(() => null) as unknown as Promise<VoucherDoc | null>)
        : Promise.resolve(null),

      // 5. User for Level Discount
      customerId && customerId !== 'null' && customerId !== 'undefined'
        ? req.payload
            .findByID({
              collection: 'users',
              id: customerId,
              depth: 0,
              select: { level: true },
              overrideAccess: true,
              req,
            })
            .catch(() => null)
        : Promise.resolve(null),

      // 6. User Level Settings
      req.payload.findGlobal({ slug: 'user-level-settings', req, depth: 0 }).catch(() => null),

      // 7. Tax Settings
      req.payload.findGlobal({ slug: 'tax-settings', req, depth: 0 }).catch(() => null),
    ])

  if (debugPayment) {
    // eslint-disable-next-line no-console
    console.log('[PAYMENT_DEBUG][cartHook][taxSettings]', {
      itemsCount: items.length,
      voucherId: data.appliedVoucher ? extractId(data.appliedVoucher) : null,
      cartTaxMode: (taxSettingsRes?.taxMode as string) || undefined,
      defaultTaxClassesCount: Array.isArray(taxSettingsRes?.defaultTaxClasses)
        ? taxSettingsRes?.defaultTaxClasses.length
        : 0,
    })
  }

  // --- Build Caches & Setup Level 2 Tax Fetching ---
  const salePriceMap = new Map<string, number>()
  salesRes.docs.forEach((s) => {
    const pid = extractId(s.product)
    if (!salePriceMap.has(pid) && s.salePrice != null) salePriceMap.set(pid, s.salePrice as number)
  })

  const productMap = new Map<string, any>()
  const productPriceMap = new Map<string, number>()
  const variantPriceMap = new Map<string, number>()
  const categoryIdsToFetch = new Set<string>()
  const taxIdsToFetch = new Set<string>()

  productsRes.docs.forEach((p) => {
    productMap.set(String(p.id), p)
    productPriceMap.set(String(p.id), p.priceInVND ?? 0)

    // Collect Category IDs
    if (p.categories) {
      p.categories.forEach((c: any) => categoryIdsToFetch.add(extractId(c)))
    }
    // Collect Product-specific Tax IDs
    if (p.taxClasses) {
      p.taxClasses.forEach((t: any) => taxIdsToFetch.add(extractId(t)))
    }
  })

  variantsRes.docs.forEach((v) => {
    variantPriceMap.set(String(v.id), (v as any).priceInVND ?? 0)
  })

  const defaultTaxIds: string[] = []
  if (
    taxSettingsRes?.defaultTaxClasses &&
    Array.isArray(taxSettingsRes.defaultTaxClasses) &&
    taxSettingsRes.defaultTaxClasses.length > 0
  ) {
    taxSettingsRes.defaultTaxClasses.forEach((t: any) => {
      const tid = extractId(t)
      if (tid) {
        taxIdsToFetch.add(tid)
        defaultTaxIds.push(tid)
      }
    })
  }

  // --- PHASE 3: Fetch Level 2 Resources Concurrently (Categories to get Category-Level Taxes) ---
  const categoriesList = Array.from(categoryIdsToFetch)

  const [categoriesRes] = await Promise.all([
    categoriesList.length > 0
      ? req.payload
          .find({
            collection: 'categories',
            where: { id: { in: categoriesList } },
            limit: categoriesList.length,
            depth: 0,
            select: { taxClasses: true },
            overrideAccess: true,
            req,
          })
          .catch(() => ({ docs: [] }))
      : { docs: [] },
  ])

  const categoryMap = new Map<string, any>()
  categoriesRes.docs.forEach((c) => {
    categoryMap.set(String(c.id), c)
    // Collect Category-specific Tax IDs
    if (c.taxClasses) {
      c.taxClasses.forEach((t: any) => taxIdsToFetch.add(extractId(t)))
    }
  })

  if (debugPayment) {
    // eslint-disable-next-line no-console
    console.log('[PAYMENT_DEBUG][cartHook][taxIdsBuild]', {
      defaultTaxIdsCount: defaultTaxIds.length,
      taxIdsToFetchCount: taxIdsToFetch.size,
      categoryIdsToFetchCount: categoriesList.length,
    })
  }

  // --- PHASE 4: Fetch ALL Required Taxes in one sweep ---
  const allTaxIds = Array.from(taxIdsToFetch)
  const taxesMap = new Map<string, any>()

  if (allTaxIds.length > 0) {
    const taxesRes = await req.payload
      .find({
        collection: 'taxes',
        where: { id: { in: allTaxIds } },
        limit: allTaxIds.length,
        depth: 0,
        overrideAccess: true,
        req,
      })
      .catch(() => ({ docs: [] }))

    taxesRes.docs.forEach((t) => taxesMap.set(String(t.id), t))
  }

  // ------------------------------------------------------------------------------------------------
  // CALCULATION LOGIC (Fully Synchronous in-memory lookup => O(N) complexity)
  // ------------------------------------------------------------------------------------------------

  const getItemPrice = (item: CartItem): number => {
    const pid = extractId(item.product)
    if (salePriceMap.has(pid)) return salePriceMap.get(pid)!
    if (item.variant) return variantPriceMap.get(extractId(item.variant)) ?? 0
    return productPriceMap.get(pid) ?? 0
  }

  // 1. Calculate Base Subtotal
  let adjustedSubtotal = 0
  for (const item of effectiveItems) {
    adjustedSubtotal += getItemPrice(item) * (item.quantity ?? 1)
  }

  data.subtotal = adjustedSubtotal
  data.originalSubtotal = adjustedSubtotal
  const baseSubtotal = adjustedSubtotal

  // 2. Calculate Voucher Discount
  let voucherDiscount = 0
  if (voucherRes) {
    const voucher = voucherRes
    const now = new Date()
    const isPublished = voucher._status === 'published'
    const isNotExpired = !voucher.validTo || new Date(voucher.validTo) > now
    const isStarted = !voucher.validFrom || new Date(voucher.validFrom) <= now
    const withinUsageLimit = voucher.maxUses == null || (voucher.usedCount ?? 0) < voucher.maxUses
    const minOrder = voucher.minOrderAmount ?? 0
    const meetsMinOrder = voucher.minOrderAmount == null || baseSubtotal >= minOrder

    if (!isPublished || !isNotExpired || !isStarted || !withinUsageLimit || !meetsMinOrder) {
      data.appliedVoucher = null
      data.voucherCode = null
    } else {
      let discountBase = baseSubtotal
      let isVoided = false

      if (voucher.scope === 'specific' && voucher.applicableProducts?.length) {
        const applicableIds = voucher.applicableProducts.map((p) => extractId(p))
        let eligibleSubtotal = 0
        for (const item of effectiveItems) {
          const pid = extractId(item.product)
          if (applicableIds.includes(pid)) {
            eligibleSubtotal += getItemPrice(item) * (item.quantity ?? 1)
          }
        }
        if (eligibleSubtotal === 0) isVoided = true
        else discountBase = eligibleSubtotal
      }

      if (isVoided) {
        data.appliedVoucher = null
        data.voucherCode = null
      } else {
        if (voucher.type === 'percent') {
          voucherDiscount = Math.floor((discountBase * (voucher.value ?? 0)) / 100)
          const maxDiscount = voucher.maxDiscount ?? 0
          if (voucher.maxDiscount != null && voucherDiscount > maxDiscount) {
            voucherDiscount = maxDiscount
          }
        } else {
          voucherDiscount = Math.min(voucher.value ?? 0, discountBase)
        }
      }
    }
  } else {
    data.appliedVoucher = null
    data.voucherCode = null
  }
  data.voucherDiscount = voucherDiscount

  // 3. Calculate User Level Discount
  let levelDiscount = 0
  if (userRes) {
    const userLevel = (userRes.level as UserLevel) || 'bronze'
    const levels = (userSettingsRes?.levels as Array<any>) || []
    const match = levels.find((l) => l.level === userLevel)

    if (match && match.discountPercent > 0) {
      levelDiscount = Math.floor((baseSubtotal * match.discountPercent) / 100)
    }
  }
  data.levelDiscount = levelDiscount

  // 4. Calculate Final Disount & Subtotal
  const totalDiscount = Math.min(voucherDiscount + levelDiscount, baseSubtotal)
  if (totalDiscount < voucherDiscount + levelDiscount) {
    data.levelDiscount = Math.max(0, totalDiscount - voucherDiscount) // Pro-rate to not exceed 100%
  }
  data.subtotal = Math.max(0, baseSubtotal - totalDiscount)

  // 5. Calculate Taxes (Hierarchical fallback)
  const taxMode = (taxSettingsRes?.taxMode as string) || 'exclusive'
  let totalTaxAmount = 0
  const taxRatesOutput: Record<string, { rate: number; name: string; amount: number }> = {}

  for (const item of effectiveItems) {
    const pid = extractId(item.product)
    const lineTotal = getItemPrice(item) * (item.quantity ?? 1)

    // Pro-rate the mixed global discounts so individual tax calculation is accurate
    const ratio = baseSubtotal > 0 ? lineTotal / baseSubtotal : 0
    const discountedLineTotal = lineTotal - totalDiscount * ratio

    const productDoc = productMap.get(pid)
    let itemTaxIds: string[] = []

    if (productDoc?.taxClasses && productDoc.taxClasses.length > 0) {
      itemTaxIds = productDoc.taxClasses.map((t: any) => extractId(t))
    } else {
      const catTaxIds: string[] = []
      if (productDoc?.categories) {
        for (const c of productDoc.categories) {
          const cid = extractId(c)
          const catDoc = categoryMap.get(cid)
          if (catDoc?.taxClasses) {
            catDoc.taxClasses.forEach((t: any) => catTaxIds.push(extractId(t)))
          }
        }
      }
      itemTaxIds = catTaxIds.length > 0 ? catTaxIds : defaultTaxIds
    }

    const uniqueItemTaxIds = Array.from(new Set(itemTaxIds))

    for (const tid of uniqueItemTaxIds) {
      const tax = taxesMap.get(tid)
      if (!tax) continue

      const rate = typeof tax.rate === 'number' ? tax.rate : 0
      let itemTaxAmount = 0

      if (taxMode === 'exclusive') {
        itemTaxAmount = (discountedLineTotal * rate) / 100
      } else if (taxMode === 'inclusive') {
        itemTaxAmount = discountedLineTotal - discountedLineTotal / (1 + rate / 100)
      }

      totalTaxAmount += itemTaxAmount

      if (!taxRatesOutput[tid]) {
        taxRatesOutput[tid] = { rate, name: tax.name || `Tax (${rate}%)`, amount: 0 }
      }
      taxRatesOutput[tid].amount += itemTaxAmount
    }
  }

  data.taxAmount = Math.round(totalTaxAmount)
  data.taxRates = Object.values(taxRatesOutput).map((t) => ({
    name: t.name,
    rate: t.rate,
    amount: Math.round(t.amount),
  }))

  if (debugPayment) {
    // eslint-disable-next-line no-console
    console.log('[PAYMENT_DEBUG][cartHook][taxResult]', {
      taxMode: taxSettingsRes?.taxMode,
      taxAmount: data.taxAmount,
      taxRatesCount: Array.isArray(data.taxRates) ? data.taxRates.length : 0,
      totalTaxIdsFetched: allTaxIds.length,
      taxesMapSize: taxesMap.size,
      baseSubtotal: baseSubtotal,
      voucherDiscount,
      levelDiscount,
      totalDiscount,
      finalSubtotal: data.subtotal,
    })
  }

  return data
}
