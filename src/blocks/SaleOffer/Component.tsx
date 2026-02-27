import type { Product, SaleEvent, SaleOfferBlock as SaleOfferBlockType } from '@/payload-types'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { SaleOfferClient } from '@/blocks/SaleOffer/Client'

type Props = SaleOfferBlockType

export const SaleOfferBlockComponent = async (props: Props) => {
  const payload = await getPayload({ config: configPromise })

  const productRel = props.product
  let product: Product | null = null

  if (productRel && typeof productRel === 'object') {
    product = productRel as Product
  } else if (typeof productRel === 'number') {
    const doc = await payload.findByID({
      collection: 'products',
      id: productRel,
      depth: 1,
      overrideAccess: false,
    })
    product = doc as Product
  }

  if (!product) return null

  const nowISO = new Date().toISOString()

  const { docs } = await payload.find({
    collection: 'sale-events',
    where: {
      and: [
        { product: { equals: product.id } },
        { status: { not_equals: 'expired' } },
        { startsAt: { less_than_equal: nowISO } },
        { endsAt: { greater_than_equal: nowISO } },
      ],
    },
    limit: 1,
    sort: 'startsAt',
    overrideAccess: true,
  })

  const activeSaleEvent = (docs?.[0] as SaleEvent) || null

  return <SaleOfferClient block={props} product={product} activeSaleEvent={activeSaleEvent} />
}
