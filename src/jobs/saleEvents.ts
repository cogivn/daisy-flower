import type { TaskHandler } from 'payload'

export const refreshSaleEventsHandler = (async ({ req }) => {
  const payload = req.payload
  const now = new Date().toISOString()
  // Mark events as expired when past endsAt
  await payload.update({
    collection: 'sale-events',
    where: {
      and: [
        { status: { not_equals: 'expired' } },
        { endsAt: { less_than: now } },
      ],
    },
    data: {
      status: 'expired',
    },
    overrideAccess: true,
  })

  // Mark events as active when within window
  await payload.update({
    collection: 'sale-events',
    where: {
      and: [
        { status: { not_equals: 'active' } },
        { startsAt: { less_than_equal: now } },
        { endsAt: { greater_than_equal: now } },
      ],
    },
    data: {
      status: 'active',
    },
    overrideAccess: true,
  })

  return { output: {}, state: 'succeeded' }
}) satisfies TaskHandler<any>

export const refreshSaleEventsTask = {
  slug: 'refresh-sale-events',
  handler: refreshSaleEventsHandler,
  schedule: [
    {
      cron: '*/2 * * * *', // every 5 minutes
      queue: 'default',
    },
  ],
}

