import type { CollectionSlug, GlobalSlug, Payload, PayloadRequest } from 'payload'

// Delete in dependency-aware order to avoid foreign key / NOT NULL constraint issues.
// For example, `form-submissions` depends on `forms`, so it must be cleared first.
const collections: CollectionSlug[] = [
  // Content + media with minimal dependencies
  'categories',
  'media',
  'pages',
  'sale-events',
  'products',

  // Form submissions depend on forms
  'form-submissions',
  'forms',

  // Ecommerce + checkout data
  'variants',
  'variantOptions',
  'variantTypes',
  'carts',
  'transactions',
  'addresses',
  'orders',
]

const globals: GlobalSlug[] = ['header', 'footer']

export async function resetDatabase({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> {
  payload.logger.info(`— Clearing collections and globals...`)

  await Promise.all(
    globals.map((global) =>
      payload.updateGlobal({
        slug: global,
        data: {},
        depth: 0,
        context: {
          disableRevalidate: true,
        },
      }),
    ),
  )

  for (const collection of collections) {
    await payload.db.deleteMany({ collection, req, where: {} })
    if (payload.collections[collection].config.versions) {
      await payload.db.deleteVersions({ collection, req, where: {} })
    }
  }
}

