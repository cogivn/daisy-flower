import type { CollectionAfterChangeHook } from 'payload'

/**
 * When a user is created (register), link any guest orders that were stored with
 * `customerEmail` to this new user via `orders.customer`.
 *
 * This allows existing guest transactions to show up in the authenticated
 * user's "Orders" page without changing the existing payment/transaction flow.
 */
export const linkOrdersCustomerByEmail: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== 'create') return doc

  const email = (doc as any)?.email
  if (!email) return doc

  // Find all orders placed as guest for this email.
  // We only update those that aren't already linked to this user.
  const ordersResult = await req.payload.find({
    collection: 'orders',
    where: {
      customerEmail: { equals: email },
    },
    depth: 0,
    limit: 0,
    pagination: false,
    overrideAccess: true,
    select: { id: true, customer: true },
    req,
  })

  const orders = ordersResult?.docs || []

  for (const order of orders) {
    const orderId = (order as any)?.id
    if (!orderId) continue

    const currentCustomer =
      typeof (order as any)?.customer === 'object' ? (order as any)?.customer?.id : (order as any)?.customer

    if (currentCustomer && Number(currentCustomer) === Number((doc as any)?.id)) {
      continue
    }

    await req.payload.update({
      collection: 'orders',
      id: orderId,
      data: {
        customer: (doc as any)?.id,
      },
      overrideAccess: true,
      depth: 0,
      req,
    })
  }

  return doc
}

