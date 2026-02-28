import { SaleOfferClient } from '@/blocks/SaleOffer/Client'
import type { Product, SaleOfferBlock as SaleOfferBlockType } from '@/payload-types'
import { getActiveSaleEvent } from '@/utilities/saleEvents'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

type Props = SaleOfferBlockType

export const SaleOfferBlockComponent = async (props: Props) => {
  const payload = await getPayload({ config: configPromise })

  const productRel = props.product
  let product: Product | null = null

  if (productRel && typeof productRel === 'object') {
    product = productRel as Product
  } else if (typeof productRel === 'number') {
    // Single API call to get product WITH sale events populated
    // Use find() instead of findByID() to support select parameter
    const result = await payload.find({
      collection: 'products',
      where: { id: { equals: productRel } },
      limit: 1,
      depth: 2,
      overrideAccess: false,
      // Remove select to rely on defaultPopulate for join fields
    })
    const doc = result.docs[0]
    product = doc as Product
  }

  if (!product) return null

  // Since join fields are not populating correctly, query sale events separately
  const nowISO = new Date().toISOString()
  const { docs: saleEvents } = await payload.find({
    collection: 'sale-events',
    where: {
      and: [
        { product: { equals: product.id } },
        {
          or: [
            { status: { equals: 'active' } },
            {
              and: [
                { status: { not_equals: 'expired' } },
                { startsAt: { less_than_equal: nowISO } },
                { endsAt: { greater_than_equal: nowISO } },
              ],
            },
          ],
        },
      ],
    },
    limit: 1,
    sort: 'startsAt',
    overrideAccess: true,
  })

  const activeSaleEvent = saleEvents[0] || null



  return <SaleOfferClient block={props} product={product} activeSaleEvent={activeSaleEvent} />
}
