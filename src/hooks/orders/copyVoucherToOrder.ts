import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Orders beforeChange hook.
 *
 * On order creation, looks up the customer's active cart and copies
 * voucher/discount metadata to the order.
 */
export const copyVoucherToOrder: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create') return data

  // Only use data.customer — never fall back to req.user to avoid
  // admin orders inheriting the admin's own cart discounts
  const customerId = data.customer
    ? typeof data.customer === 'object'
      ? data.customer.id
      : data.customer
    : null

  if (!customerId) return data

  try {
    const { docs: carts } = await req.payload.find({
      collection: 'carts',
      where: {
        and: [{ customer: { equals: customerId } }, { purchasedAt: { exists: false } }],
      },
      sort: '-updatedAt',
      limit: 1,
      depth: 0,
      select: {
        appliedVoucher: true,
        voucherCode: true,
        voucherDiscount: true,
        levelDiscount: true,
        originalSubtotal: true,
        taxAmount: true,
        taxRates: true,
      },
      overrideAccess: true,
      req,
    })

    const cart = carts[0]
    if (!cart) return data

    if (cart.appliedVoucher) {
      data.voucher =
        typeof cart.appliedVoucher === 'object' ? cart.appliedVoucher.id : cart.appliedVoucher
      data.voucherCode = cart.voucherCode || null
      data.discountAmount = cart.voucherDiscount || 0
    }

    data.levelDiscount = (cart.levelDiscount as number) || 0

    // IMPORTANT:
    // CheckoutPage/adapters already compute taxAmount/taxRates and pass them
    // in `data`. But the cart snapshot can be stale/0, so avoid overwriting
    // non-empty tax data coming from the checkout flow.
    const existingTaxAmount = data.taxAmount
    const existingTaxRates = data.taxRates

    const hasExistingTaxAmount = typeof existingTaxAmount === 'number' && existingTaxAmount > 0
    const hasExistingTaxRates =
      (Array.isArray(existingTaxRates) && existingTaxRates.length > 0) ||
      (existingTaxRates && typeof existingTaxRates === 'object' && !Array.isArray(existingTaxRates))

    data.taxAmount = hasExistingTaxAmount ? (existingTaxAmount as number) : (cart.taxAmount as number) || 0
    data.taxRates = hasExistingTaxRates ? existingTaxRates : cart.taxRates || []
  } catch {
    // If cart lookup fails, proceed without discount data
    req.payload.logger.warn('Could not copy voucher data from cart to order.')
  }

  return data
}
