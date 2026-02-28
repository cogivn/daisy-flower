import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Orders beforeChange hook.
 *
 * On order creation, looks up the customer's active cart and copies
 * voucher/discount metadata to the order.
 */
export const copyVoucherToOrder: CollectionBeforeChangeHook = async ({
  data,
  operation,
  req,
}) => {
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
        and: [
          { customer: { equals: customerId } },
          { purchasedAt: { exists: false } },
        ],
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
      },
      overrideAccess: true,
      req,
    })

    const cart = carts[0]
    if (!cart) return data

    if (cart.appliedVoucher) {
      data.voucher =
        typeof cart.appliedVoucher === 'object'
          ? (cart.appliedVoucher as any).id
          : cart.appliedVoucher
      data.voucherCode = cart.voucherCode || null
      data.discountAmount = cart.voucherDiscount || 0
    }

    data.levelDiscount = (cart.levelDiscount as number) || 0
  } catch {
    // If cart lookup fails, proceed without discount data
    req.payload.logger.warn('Could not copy voucher data from cart to order.')
  }

  return data
}
