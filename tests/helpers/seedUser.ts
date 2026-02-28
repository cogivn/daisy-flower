import { getPayload } from 'payload'
import config from '../../src/payload.config.js'

export const testUser = {
  email: 'admin@daisy.com',
  password: 'admin',
  roles: ['admin'] as ('admin' | 'customer')[],
}

/**
 * Seeds a test user for e2e admin tests.
 */
export async function seedTestUser(): Promise<void> {
  const payload = await getPayload({ config })

  // Delete existing test user if any
  await payload.delete({
    collection: 'users',
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })

  // Create fresh test user
  await payload.create({
    collection: 'users',
    data: testUser,
  })
}

/**
 * Seeds test data (media, products, variants) for E2E tests.
 */
export async function seedTestData(): Promise<{
  productID: string | number
  productWithVariantsID: string | number
}> {
  const payload = await getPayload({ config })

  // 1. Cleanup old test data
  await payload.delete({
    collection: 'products',
    where: {
      slug: {
        in: ['test-product', 'test-product-variants', 'no-inventory-product'],
      },
    },
  })
  // Also cleanup by contains 'test-' just in case
  await payload.delete({
    collection: 'products',
    where: {
      slug: {
        contains: 'test-',
      },
    },
  })
  await payload.delete({
    collection: 'variants',
    where: {
      _status: {
        equals: 'published',
      },
    },
  })
  await payload.delete({
    collection: 'variantOptions',
    where: {
      value: {
        in: ['payload', 'figma'],
      },
    },
  })
  await payload.delete({
    collection: 'variantTypes',
    where: {
      name: {
        equals: 'brand',
      },
    },
  })
  await payload.delete({
    collection: 'media',
    where: {
      alt: {
        equals: 'Test Image E2E',
      },
    },
  })

  // 2. Create Variant Type
  const variantType = await payload.create({
    collection: 'variantTypes',
    data: {
      name: 'brand',
      label: 'Brand',
    },
  })

  // 3. Create Variant Options
  const payloadOption = await payload.create({
    collection: 'variantOptions',
    data: {
      label: 'Payload',
      value: 'payload',
      variantType: variantType.id,
    },
  })

  const figmaOption = await payload.create({
    collection: 'variantOptions',
    data: {
      label: 'Figma',
      value: 'figma',
      variantType: variantType.id,
    },
  })

  // 4. Create Media
  // For E2E we can just point to an existing file in the upload dir or upload fresh.
  // Using an existing file in public/media/banner1.jpg
  const media = await payload.create({
    collection: 'media',
    data: {
      alt: 'Test Image E2E',
    },
    filePath: 'public/media/banner1.jpg', // Local filePath for initial upload
  })

  // 5. Create Product with Variants
  const productWithVariants = await payload.create({
    collection: 'products',
    data: {
      title: 'Test Product With Variants',
      slug: 'test-product-variants',
      enableVariants: true,
      variantTypes: [variantType.id],
      inventory: 100,
      _status: 'published',
      gallery: [{ image: media.id }],
      priceInUSDEnabled: true,
      priceInUSD: 1000,
    },
  })

  // 6. Create Variants
  await payload.create({
    collection: 'variants',
    data: {
      product: productWithVariants.id,
      options: [payloadOption.id],
      priceInUSDEnabled: true,
      priceInUSD: 1000,
      inventory: 50,
      _status: 'published',
    },
  })

  await payload.create({
    collection: 'variants',
    data: {
      product: productWithVariants.id,
      options: [figmaOption.id],
      priceInUSDEnabled: true,
      priceInUSD: 1000,
      inventory: 50,
      _status: 'published',
    },
  })

  // 7. Create Simple Product
  const simpleProduct = await payload.create({
    collection: 'products',
    data: {
      title: 'Test Product',
      slug: 'test-product',
      inventory: 100,
      _status: 'published',
      gallery: [{ image: media.id }],
      priceInUSDEnabled: true,
      priceInUSD: 1000,
    },
  })

  // 8. Create No Inventory Product
  await payload.create({
    collection: 'products',
    data: {
      title: 'No Inventory Product',
      slug: 'no-inventory-product',
      inventory: 0,
      _status: 'published',
      gallery: [{ image: media.id }],
      priceInUSDEnabled: true,
      priceInUSD: 1000,
    },
  })

  return {
    productID: simpleProduct.id,
    productWithVariantsID: productWithVariants.id,
  }
}

/**
 * Cleans up test user after tests
 */
export async function cleanupTestUser(): Promise<void> {
  const payload = await getPayload({ config })

  await payload.delete({
    collection: 'users',
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })
}
