import { isDocumentOwner } from '@/access/isDocumentOwner'
import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'

export const Wishlist: CollectionConfig = {
  slug: 'wishlist',
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation === 'create') {
          const existing = await req.payload.find({
            collection: 'wishlist',
            where: {
              and: [{ customer: { equals: data.customer } }, { product: { equals: data.product } }],
            },
            limit: 1,
            req,
          })

          if (existing.totalDocs > 0) {
            throw new APIError('This product is already in your wishlist.', 400)
          }
        }
        return data
      },
    ],
  },
  access: {
    create: ({ req }) => Boolean(req.user),
    read: isDocumentOwner,
    update: isDocumentOwner,
    delete: isDocumentOwner,
  },
  admin: {
    useAsTitle: 'id',
    group: 'Shop',
    defaultColumns: ['customer', 'product', 'createdAt'],
    hidden: true,
  },
  fields: [
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true,
      index: true,
    },
  ],
  timestamps: true,
}
