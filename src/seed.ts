import 'dotenv/config'
import { createLocalReq, getPayload } from 'payload'

import { seed } from '@/endpoints/seed'
import config from '@payload-config'

async function main() {
  const payload = await getPayload({ config })

  // Create a Local API request with an admin-like user context
  const req = await createLocalReq(
    {
      user: {
        id: 'seed-script',
        roles: ['admin'],
        email: 'seed@example.com',
      } as any,
    },
    payload,
  )

  await seed({ payload, req })

  payload.logger.info('Seeding complete.')
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Error running seed script', err)
  process.exit(1)
})

