import type { CollectionAfterChangeHook } from 'payload'

const TERMINAL_STATUSES = ['cancelled', 'refunded']

/**
 * Orders afterChange hook.
 *
 * Increment usedCount when an order with a voucher transitions INTO a non-terminal status
 * (e.g. processing, completed) for the first time (create).
 * Decrement usedCount when an order transitions INTO cancelled/refunded from ANY active status.
 *
 * This prevents "usage leak" where cancelled-from-processing orders permanently inflate usedCount.
 */
export const incrementVoucherUsage: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
  context,
}) => {
  if (context.skipVoucherSync) return doc

  const voucherId =
    typeof doc.voucher === 'object' && doc.voucher !== null ? doc.voucher.id : doc.voucher

  if (!voucherId) return doc

  if (operation === 'create') {
    if (!TERMINAL_STATUSES.includes(doc.status)) {
      await adjustUsedCount(req, voucherId, 1)
    }
    return doc
  }

  const statusChanged = doc.status !== previousDoc?.status
  if (!statusChanged) return doc

  const wasTerminal = TERMINAL_STATUSES.includes(previousDoc?.status)
  const isTerminal = TERMINAL_STATUSES.includes(doc.status)

  if (!wasTerminal && isTerminal) {
    // Active → cancelled/refunded: release usage slot
    await adjustUsedCount(req, voucherId, -1)
  } else if (wasTerminal && !isTerminal) {
    // cancelled/refunded → active (re-activated order): re-claim usage slot
    await adjustUsedCount(req, voucherId, 1)
  }

  return doc
}

async function adjustUsedCount(
  req: Parameters<CollectionAfterChangeHook>[0]['req'],
  voucherId: number | string,
  delta: number,
) {
  const voucher = await req.payload.findByID({
    collection: 'vouchers',
    id: voucherId,
    select: { usedCount: true },
    overrideAccess: true,
    req,
  })

  const currentCount = (voucher.usedCount as number) || 0
  const newCount = Math.max(0, currentCount + delta)

  await req.payload.update({
    collection: 'vouchers',
    id: voucherId,
    data: { usedCount: newCount },
    select: { code: true },
    overrideAccess: true,
    context: { skipVoucherSync: true },
    req,
  })
}
