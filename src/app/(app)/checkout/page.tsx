import type { Metadata } from 'next'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { Fragment } from 'react'

import { CheckoutPage } from '@/components/checkout/CheckoutPage'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

export default async function Checkout() {
  const payload = await getPayload({ config: configPromise })

  const [saleEventsRes, levelSettingsRes] = await Promise.all([
    payload.find({
      collection: 'sale-events',
      where: { status: { equals: 'active' } },
      depth: 0,
      limit: 100,
    }),
    payload.findGlobal({ slug: 'user-level-settings' }),
  ])

  const salePrices: Record<string, number> = {}
  for (const sale of saleEventsRes.docs) {
    const pid = typeof sale.product === 'object' ? sale.product?.id : sale.product
    if (pid && typeof sale.salePrice === 'number') {
      salePrices[String(pid)] = sale.salePrice
    }
  }

  const levels =
    (levelSettingsRes?.levels as Array<{ level: string; discountPercent: number }>) || []

  return (
    <div className="container min-h-[90vh] flex">
      {!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && (
        <div>
          <Fragment>
            {'To enable checkout, you must '}
            <a
              href="https://dashboard.stripe.com/test/apikeys"
              rel="noopener noreferrer"
              target="_blank"
            >
              obtain your Stripe API Keys
            </a>
            {' then set them as environment variables. See the '}
            <a
              href="https://github.com/payloadcms/payload/blob/main/templates/ecommerce/README.md#stripe"
              rel="noopener noreferrer"
              target="_blank"
            >
              README
            </a>
            {' for more details.'}
          </Fragment>
        </div>
      )}

      <h1 className="sr-only">Checkout</h1>

      <CheckoutPage salePrices={salePrices} levels={levels} />
    </div>
  )
}

export const metadata: Metadata = {
  description: 'Checkout.',
  openGraph: mergeOpenGraph({
    title: 'Checkout',
    url: '/checkout',
  }),
  title: 'Checkout',
}
