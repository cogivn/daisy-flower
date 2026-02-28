import type { TaskHandler } from 'payload'

export const cleanupAbandonedOrdersHandler = (async ({ req }) => {
  const payload = req.payload

  // Calculate the threshold time - 30 minutes ago
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()

  try {
    // We fetch them first because the afterChange hook needs to run for each
    // order to restore the voucher usage, and payload's updateMany doesn't always
    // trigger hooks individually in all versions, but let's see.
    // Actually, Payload's `update` with `where` triggers hooks for all matched docs!
    const result = await payload.update({
      collection: 'orders',
      where: {
        and: [{ status: { equals: 'processing' } }, { updatedAt: { less_than: thirtyMinutesAgo } }],
      },
      data: {
        status: 'cancelled',
      },
      overrideAccess: true,
      req, // Pass req to ensure context is propagated if needed
    })

    if (result.docs.length > 0) {
      payload.logger.info(`Cleaned up ${result.docs.length} abandoned orders.`)
    }

    return { output: { cancelled: result.docs.length }, state: 'succeeded' }
  } catch (err) {
    payload.logger.error({ err }, 'Error cleaning up abandoned orders')
    return { output: { error: err instanceof Error ? err.message : String(err) }, state: 'failed' }
  }
}) satisfies TaskHandler<'cleanup-abandoned-orders'>

export const cleanupAbandonedOrdersTask = {
  slug: 'cleanup-abandoned-orders',
  handler: cleanupAbandonedOrdersHandler,
  schedule: [
    {
      cron: '*/15 * * * *', // every 15 minutes
      queue: 'default',
    },
  ],
}
