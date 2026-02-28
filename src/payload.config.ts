import { sqliteAdapter } from '@payloadcms/db-sqlite'
import {
  BoldFeature,
  EXPERIMENTAL_TableFeature,
  IndentFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  UnderlineFeature,
  UnorderedListFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

import { Brands } from '@/collections/Brands'
import { Categories } from '@/collections/Categories'
import { Media } from '@/collections/Media'
import { Pages } from '@/collections/Pages'
import { SaleEvents } from '@/collections/SaleEvents'
import { Users } from '@/collections/Users'
import { Vouchers } from '@/collections/Vouchers'
import { applyVoucherToCart } from '@/endpoints/applyVoucherToCart'
import { removeVoucherFromCart } from '@/endpoints/removeVoucherFromCart'
import { validateVoucher } from '@/endpoints/validateVoucher'
import { validateVoucherForPayment } from '@/endpoints/validateVoucherForPayment'
import { Footer } from '@/globals/Footer'
import { Header } from '@/globals/Header'
import { UserLevelSettings } from '@/globals/UserLevelSettings'
import { cleanupAbandonedOrdersTask } from '@/jobs/abandonedOrders'
import { cleanupExpiredVoucherReservationsTask } from '@/jobs/cleanupExpiredVoucherReservations'
import { refreshSaleEventsTask } from '@/jobs/saleEvents'
import { plugins } from './plugins'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    components: {
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeLogin` statement on line 15.
      beforeLogin: ['@/components/BeforeLogin#BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeDashboard` statement on line 15.
      beforeDashboard: ['@/components/BeforeDashboard#BeforeDashboard'],
    },
    user: Users.slug,
  },
  collections: [Users, Pages, Categories, Media, Brands, SaleEvents, Vouchers],
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URL || '',
    },
  }),
  editor: lexicalEditor({
    features: () => {
      return [
        UnderlineFeature(),
        BoldFeature(),
        ItalicFeature(),
        OrderedListFeature(),
        UnorderedListFeature(),
        LinkFeature({
          enabledCollections: ['pages'],
          fields: ({ defaultFields }) => {
            const defaultFieldsWithoutUrl = defaultFields.filter((field) => {
              if ('name' in field && field.name === 'url') return false
              return true
            })

            return [
              ...defaultFieldsWithoutUrl,
              {
                name: 'url',
                type: 'text',
                admin: {
                  condition: ({ linkType }) => linkType !== 'internal',
                },
                label: ({ t }) => t('fields:enterURL'),
                required: true,
              },
            ]
          },
        }),
        IndentFeature(),
        EXPERIMENTAL_TableFeature(),
      ]
    },
  }),
  //email: nodemailerAdapter(),
  jobs: {
    autoRun: [
      {
        cron: '* * * * *', // check 'default' queue every minute
        queue: 'default',
      },
    ],
    tasks: [refreshSaleEventsTask, cleanupAbandonedOrdersTask, cleanupExpiredVoucherReservationsTask],
  },
  endpoints: [validateVoucher, applyVoucherToCart, removeVoucherFromCart, validateVoucherForPayment],
  globals: [Header, Footer, UserLevelSettings],
  plugins,
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  onInit: async (payload) => {
    const jobsConfig = payload.config.jobs

    if (jobsConfig?.autoRun && Array.isArray(jobsConfig.autoRun)) {
      const queues = jobsConfig.autoRun
        .map((cfg: { cron?: string; queue?: string }) => cfg.queue)
        .filter(Boolean)
        .join(', ')

      payload.logger.info(
        queues && queues.length
          ? `Jobs autoRun enabled for queues: ${queues}`
          : 'Jobs autoRun enabled with custom configuration.',
      )
    } else {
      payload.logger.info('Jobs autoRun is not configured.')
    }
  },
  // Sharp is now an optional dependency -
  // if you want to resize images, crop, set focal point, etc.
  // make sure to install it and pass it to the config.
  // sharp,
})
