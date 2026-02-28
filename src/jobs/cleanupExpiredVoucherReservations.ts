import type { TaskHandler } from 'payload'

/**
 * Cleanup job for expired voucher reservations.
 *
 * Runs periodically to:
 * 1. Find carts with expired voucher reservations (reservedVoucherExpiresAt < now)
 * 2. Clear appliedVoucher, voucherCode, voucherDiscount, and reservedVoucherExpiresAt
 * 3. Only affect carts that haven't been purchased yet
 */
export const cleanupExpiredVoucherReservationsHandler = (async ({ req }) => {
  const payload = req.payload

  // Find carts with expired reservations that haven't been purchased
  const now = new Date().toISOString()

  try {
    const result = await payload.update({
      collection: 'carts',
      where: {
        and: [
          { reservedVoucherExpiresAt: { less_than: now } },
          { purchasedAt: { exists: false } },
          { appliedVoucher: { exists: true } },
        ],
      },
      data: {
        appliedVoucher: null,
        voucherCode: null,
        voucherDiscount: 0,
        reservedVoucherExpiresAt: null,
      },
      overrideAccess: true,
      req,
    })

    if (result.docs.length > 0) {
      payload.logger.info(
        `Cleaned up ${result.docs.length} expired voucher reservation(s).`,
      )
    }

    return { output: { cleaned: result.docs.length }, state: 'succeeded' }
  } catch (err) {
    payload.logger.error({ err }, 'Error cleaning up expired voucher reservations')
    return { output: { error: err instanceof Error ? err.message : String(err) }, state: 'failed' }
  }
}) satisfies TaskHandler<'cleanup-expired-voucher-reservations'>

export const cleanupExpiredVoucherReservationsTask = {
  slug: 'cleanup-expired-voucher-reservations',
  handler: cleanupExpiredVoucherReservationsHandler,
  schedule: [
    {
      cron: '*/5 * * * *', // every 5 minutes
      queue: 'default',
    },
  ],
}
