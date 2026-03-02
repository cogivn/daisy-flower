import 'dotenv/config'
import { createLocalReq, getPayload } from 'payload'

import config from '@payload-config'
import { User } from './payload-types'

async function seedTaxes() {
  const payload = await getPayload({ config })

  // Tạo Local API Request
  const req = await createLocalReq(
    {
      user: {
        id: -1,
        roles: ['admin'],
        email: 'seed@daisyflower.com',
      } as unknown as User,
    },
    payload,
  )

  payload.logger.info('--- 🌱 STARTING SEED FOR TAXES (TAX CLASSES) 🌱 ---')

  // 1. Tạo VAT 8% (Default)
  payload.logger.info('1. Creating Standard VAT class...')
  const vat8 = await payload.create({
    collection: 'taxes',
    data: {
      name: 'Standard VAT (8%)',
      rate: 8,
    },
    req,
  })

  // 2. Tạo Hoa tươi 0%
  payload.logger.info('2. Creating Fresh Flowers Zero Rated class...')
  await payload.create({
    collection: 'taxes',
    data: {
      name: 'Fresh Flowers (Zero Rated 0%)',
      rate: 0,
    },
    req,
  })

  // 3. Tạo Phụ kiện 10%
  payload.logger.info('3. Creating Gifts / Accessories class...')
  await payload.create({
    collection: 'taxes',
    data: {
      name: 'Gifts / Accessories (10%)',
      rate: 10,
    },
    req,
  })

  // 4. Cấu hình Global Tax Settings
  payload.logger.info('4. Setting Standard VAT as the default tax classes...')
  await payload.updateGlobal({
    slug: 'tax-settings',
    data: {
      taxMode: 'exclusive',
      defaultTaxClasses: [vat8.id as number],
    },
    req,
  })

  payload.logger.info('--- ✨ TAX SEED COMPLETED SUCCESSFULLY ✨ ---')
  payload.logger.info(`Set Default Tax Class to: ${vat8.name}`)

  process.exit(0)
}

seedTaxes().catch((err) => {
  console.error('Error seeding taxes:', err)
  process.exit(1)
})
