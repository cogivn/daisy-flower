import type { Transaction } from '@/payload-types'
import type { Payload, PayloadRequest } from 'payload'

import type { SeedContext } from './helpers'
import { createSeedContext, rt, seedMediaBatch, withRetry } from './helpers'

/* eslint-disable @typescript-eslint/no-explicit-any */
import { contactFormData } from './contact-form'
import { contactPageData } from './contact-page'
import { categories as categorySeedData } from './data/categories'
import { footerData, headerData } from './data/globals'
import { bannerMedia, blogMedia, heroMedia, legacyMedia, productMedia } from './data/media-urls'
import { simpleProducts } from './data/products'
import { homePageData } from './home'
import { newsletterFormData } from './newsletter-form'
import { resetDatabase } from './reset'

export const seed = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  payload.logger.info('Seeding database...')
  await resetDatabase({ payload, req })

  const ctx = createSeedContext(payload)

  await stepMedia(ctx)
  await stepUsers(ctx)
  await stepCategories(ctx)
  await stepProducts(ctx)
  await stepSaleEvents(ctx)
  await stepForms(ctx)
  await stepPages(ctx)
  await stepEcommerce(ctx)
  await stepGlobals(ctx)

  payload.logger.info('Seeded database successfully!')
}

// ──────────────────────────────────────────────
// Step 1: Media
// ──────────────────────────────────────────────

async function stepMedia(ctx: SeedContext) {
  ctx.payload.logger.info('— Seeding media...')

  await seedMediaBatch(ctx, [
    ...legacyMedia,
    ...heroMedia,
    ...productMedia,
    ...bannerMedia,
    ...blogMedia,
  ])
}

// ──────────────────────────────────────────────
// Step 2: Users
// ──────────────────────────────────────────────

async function stepUsers(ctx: SeedContext) {
  ctx.payload.logger.info('— Seeding users...')

  // Seed Customer
  await ctx.payload.delete({
    collection: 'users',
    depth: 0,
    where: { email: { equals: 'customer@example.com' } },
  })

  const customer = await ctx.payload.create({
    collection: 'users',
    data: {
      name: 'Customer',
      email: 'customer@example.com',
      password: 'password',
      roles: ['customer'],
    },
  })

  ctx.users.customer = { id: customer.id, email: customer.email }

  // Seed Admin
  await ctx.payload.delete({
    collection: 'users',
    depth: 0,
    where: { email: { equals: 'admin@daisy.com' } },
  })

  await ctx.payload.create({
    collection: 'users',
    data: {
      name: 'Admin',
      email: 'admin@daisy.com',
      password: 'admin',
      roles: ['admin'],
    },
  })
}

// ──────────────────────────────────────────────
// Step 3: Categories
// ──────────────────────────────────────────────

async function stepCategories(ctx: SeedContext) {
  ctx.payload.logger.info('— Seeding categories...')

  const docs = await Promise.all(
    categorySeedData.map((cat) =>
      ctx.payload.create({
        collection: 'categories',
        data: {
          title: cat.title,
          slug: cat.slug,
          description: cat.description,
          ...(cat.bannerKey && ctx.media[cat.bannerKey]
            ? { image: ctx.media[cat.bannerKey].id }
            : {}),
        } as any,
      }),
    ),
  )

  for (const doc of docs) {
    ctx.categories[doc.slug!] = { id: doc.id, title: doc.title, slug: doc.slug! }
  }
}

// ──────────────────────────────────────────────
// Step 4: Products
// ──────────────────────────────────────────────

async function stepProducts(ctx: SeedContext) {
  ctx.payload.logger.info('— Seeding products...')

  // 4a. Featured product: Aurora Rose Bouquet
  const hatMedia = ctx.media.hat
  const galleryImages = Array.from({ length: 5 }, (_, i) => {
    const key = `product${(i % 12) + 1}`
    return { image: ctx.media[key]?.id }
  }).filter((g) => g.image)

  const auroraRose = await ctx.payload.create({
    collection: 'products',
    depth: 0,
    data: {
      _status: 'published',
      title: 'Aurora Rose Bouquet',
      slug: 'aurora-rose-bouquet',
      categories: [ctx.categories['bouquets']?.id].filter(Boolean),
      enableVariants: false,
      priceInUSDEnabled: true,
      priceInUSD: 4999,
      gallery: galleryImages,
      description: rt.root([
        rt.paragraph(
          'Aurora Rose Bouquet combines soft pink and ivory roses with airy filler flowers and fresh foliage. Wrapped in eco‑friendly paper and finished with a satin ribbon, it is an elegant choice for gifting or styling your living room.',
        ),
      ]),
      meta: {
        title: 'Aurora Rose Bouquet',
        description: 'A lush hand‑tied bouquet of premium roses and seasonal greenery.',
        image: hatMedia?.id,
      },
    } as any,
  })
  ctx.products['aurora-rose-bouquet'] = {
    id: auroraRose.id,
    title: auroraRose.title,
    slug: 'aurora-rose-bouquet',
  }

  // 4b. Variant product: Evergreen Desk Plant
  const sizeType = await ctx.payload.create({
    collection: 'variantTypes',
    data: { name: 'size', label: 'Size' },
  })
  ctx.variantTypes.size = { id: sizeType.id }

  const colorType = await ctx.payload.create({
    collection: 'variantTypes',
    data: { name: 'color', label: 'Color' },
  })
  ctx.variantTypes.color = { id: colorType.id }

  const sizeOptions = [
    { label: 'Small', value: 'small' },
    { label: 'Medium', value: 'medium' },
    { label: 'Large', value: 'large' },
    { label: 'X Large', value: 'xlarge' },
  ]

  for (const opt of sizeOptions) {
    const doc = await ctx.payload.create({
      collection: 'variantOptions',
      data: { ...opt, variantType: sizeType.id },
    })
    ctx.variantOptions[opt.value] = { id: doc.id, value: opt.value }
  }

  const colorOptions = [
    { label: 'Black', value: 'black' },
    { label: 'White', value: 'white' },
  ]

  const colorDocs = await Promise.all(
    colorOptions.map((opt) =>
      ctx.payload.create({
        collection: 'variantOptions',
        data: { ...opt, variantType: colorType.id },
      }),
    ),
  )
  for (let i = 0; i < colorOptions.length; i++) {
    ctx.variantOptions[colorOptions[i].value] = {
      id: colorDocs[i].id,
      value: colorOptions[i].value,
    }
  }

  const evergreenPlant = await ctx.payload.create({
    collection: 'products',
    depth: 0,
    data: {
      _status: 'published',
      title: 'Evergreen Desk Plant',
      slug: 'evergreen-desk-plant',
      categories: [ctx.categories['indoor-plants']?.id].filter(Boolean),
      enableVariants: true,
      variantTypes: [sizeType, colorType],
      inventory: 0,
      priceInUSDEnabled: true,
      priceInUSD: 3999,
      gallery: [
        { image: ctx.media.tshirtBlack?.id, variantOption: ctx.variantOptions.black?.id },
        { image: ctx.media.tshirtWhite?.id, variantOption: ctx.variantOptions.white?.id },
      ].filter((g) => g.image),
      description: rt.root([
        rt.paragraph(
          'Evergreen Desk Plant is a low‑maintenance, air‑purifying plant that thrives in indirect light. Each plant is potted in a ceramic container with drainage and decorative stones, making it a ready‑to‑gift piece of decor.',
        ),
      ]),
      layout: [{ blockType: 'mediaBlock', media: ctx.media.hero1?.id }],
      meta: {
        title: 'Evergreen Desk Plant',
        description: 'A compact evergreen plant in a minimalist pot.',
        image: ctx.media.tshirtBlack?.id,
      },
      relatedProducts: [auroraRose],
    } as any,
  })
  ctx.products['evergreen-desk-plant'] = {
    id: evergreenPlant.id,
    title: evergreenPlant.title,
    slug: 'evergreen-desk-plant',
  }

  // Create variants for desk plant
  const white = ctx.variantOptions.white
  const black = ctx.variantOptions.black

  for (const sizeVal of ['small', 'medium', 'large', 'xlarge']) {
    const sizeOpt = ctx.variantOptions[sizeVal]
    await ctx.payload.create({
      collection: 'variants',
      depth: 0,
      data: {
        product: evergreenPlant,
        options: [sizeOpt, white],
        inventory: 492,
        priceInUSDEnabled: true,
        priceInUSD: 4999,
        _status: 'published',
      } as any,
    })
    await ctx.payload.create({
      collection: 'variants',
      depth: 0,
      data: {
        product: evergreenPlant,
        options: [sizeOpt, black],
        inventory: sizeVal === 'medium' ? 0 : 492,
        priceInUSDEnabled: true,
        priceInUSD: 4999,
        _status: 'published',
      } as any,
    })
  }

  // Store specific variants we need later for carts/orders
  const mediumWhiteVariant = await ctx.payload.find({
    collection: 'variants',
    where: {
      and: [{ product: { equals: evergreenPlant.id } }],
    },
    limit: 1,
    depth: 0,
  })
  if (mediumWhiteVariant.docs[0]) {
    ctx.misc.sampleVariant1 = mediumWhiteVariant.docs[0].id
  }

  const smallVariant = await ctx.payload.find({
    collection: 'variants',
    where: {
      and: [{ product: { equals: evergreenPlant.id } }],
    },
    limit: 2,
    depth: 0,
  })
  if (smallVariant.docs[1]) {
    ctx.misc.sampleVariant2 = smallVariant.docs[1].id
  }

  // 4c. Simple products from data file
  await Promise.all(
    simpleProducts.map((item) => {
      const mediaDoc = ctx.media[item.imageKey]
      const categoryDoc = ctx.categories[item.categorySlug]

      const gallery = Array.from({ length: 5 }, (_, i) => {
        const idx = (parseInt(item.imageKey.replace('product', ''), 10) - 1 + i) % 12
        const key = `product${idx + 1}`
        return { image: ctx.media[key]?.id }
      }).filter((g) => g.image)

      return ctx.payload.create({
        collection: 'products',
        depth: 0,
        data: {
          _status: 'published',
          title: item.title,
          slug: item.slug,
          categories: categoryDoc ? [categoryDoc] : [],
          enableVariants: false,
          priceInUSDEnabled: true,
          priceInUSD: item.priceInUSD,
          gallery,
          meta: { title: item.title, description: item.title, image: mediaDoc?.id },
        } as any,
      })
    }),
  )
}

// ──────────────────────────────────────────────
// Step 5: Sale Events
// ──────────────────────────────────────────────

async function stepSaleEvents(ctx: SeedContext) {
  ctx.payload.logger.info('— Seeding sale events...')

  const aurora = ctx.products['aurora-rose-bouquet']
  if (!aurora) return

  const now = new Date()

  await ctx.payload.create({
    collection: 'sale-events',
    data: {
      title: 'Aurora Rose Bouquet Launch Offer',
      product: aurora.id as number,
      salePrice: Math.floor(4999 * 0.8),
      status: 'active',
      startsAt: new Date(now.getTime() - 3600000).toISOString(),
      endsAt: new Date(now.getTime() + 7 * 86400000).toISOString(),
      notes: 'Seeded example sale event.',
    },
  })
}

// ──────────────────────────────────────────────
// Step 6: Forms
// ──────────────────────────────────────────────

async function stepForms(ctx: SeedContext) {
  ctx.payload.logger.info('— Seeding forms...')

  const contactForm = await ctx.payload.create({
    collection: 'forms',
    depth: 0,
    data: contactFormData(),
  })
  ctx.forms.contact = { id: contactForm.id }

  const newsletterForm = await ctx.payload.create({
    collection: 'forms',
    depth: 0,
    data: newsletterFormData(),
  })
  ctx.forms.newsletter = { id: newsletterForm.id }
}

// ──────────────────────────────────────────────
// Step 7: Pages
// ──────────────────────────────────────────────

async function stepPages(ctx: SeedContext) {
  ctx.payload.logger.info('— Seeding pages...')

  await Promise.all([
    ctx.payload.create({
      collection: 'pages',
      depth: 0,
      data: homePageData({ ctx }),
      context: { disableRevalidate: true },
    }),
    ctx.payload.create({
      collection: 'pages',
      depth: 0,
      data: contactPageData(ctx.forms.contact.id),
      context: { disableRevalidate: true },
    }),
  ])
}

// ──────────────────────────────────────────────
// Step 8: Ecommerce (addresses, transactions, carts, orders)
// ──────────────────────────────────────────────

const addressUS: Transaction['billingAddress'] = {
  title: 'Dr.',
  firstName: 'Otto',
  lastName: 'Octavius',
  phone: '1234567890',
  company: 'Oscorp',
  addressLine1: '123 Main St',
  addressLine2: 'Suite 100',
  city: 'New York',
  state: 'NY',
  postalCode: '10001',
  country: 'US',
}

const addressUK: Transaction['billingAddress'] = {
  title: 'Mr.',
  firstName: 'Oliver',
  lastName: 'Twist',
  phone: '1234567890',
  addressLine1: '48 Great Portland St',
  city: 'London',
  postalCode: 'W1W 7ND',
  country: 'GB',
}

async function stepEcommerce(ctx: SeedContext) {
  ctx.payload.logger.info('— Seeding ecommerce data...')

  const customerId = ctx.users.customer.id
  const plantId = ctx.products['evergreen-desk-plant']?.id
  const roseId = ctx.products['aurora-rose-bouquet']?.id
  const variant1 = ctx.misc.sampleVariant1 as number | string
  const variant2 = ctx.misc.sampleVariant2 as number | string

  await Promise.all([
    ctx.payload.create({
      collection: 'addresses',
      depth: 0,
      data: { customer: customerId, ...addressUS } as any,
    }),
    ctx.payload.create({
      collection: 'addresses',
      depth: 0,
      data: { customer: customerId, ...addressUK } as any,
    }),
  ])

  const txnData = {
    currency: 'USD',
    customer: customerId,
    paymentMethod: 'stripe',
    stripe: { customerID: 'cus_123', paymentIntentID: 'pi_123' },
    billingAddress: addressUS,
  }

  await ctx.payload.create({
    collection: 'transactions',
    data: { ...txnData, status: 'pending' } as any,
  })
  const txn = await ctx.payload.create({
    collection: 'transactions',
    data: { ...txnData, status: 'succeeded' } as any,
  })

  const createCart = (data: Record<string, unknown>) =>
    withRetry(() => ctx.payload.create({ collection: 'carts', data: data as any }))

  await createCart({
    customer: customerId,
    currency: 'USD',
    items: [{ product: plantId, variant: variant1, quantity: 1 }],
  })

  await createCart({
    currency: 'USD',
    createdAt: new Date('2023-01-01T00:00:00Z').toISOString(),
    items: [{ product: roseId, quantity: 1 }],
  })

  await createCart({
    customer: customerId,
    currency: 'USD',
    purchasedAt: new Date().toISOString(),
    subtotal: 7499,
    items: [
      { product: plantId, variant: variant1, quantity: 1 },
      { product: plantId, variant: variant2, quantity: 1 },
    ],
  })

  const orderItems = [
    { product: plantId, variant: variant1, quantity: 1 },
    { product: plantId, variant: variant2, quantity: 1 },
  ]

  await ctx.payload.create({
    collection: 'orders',
    data: {
      amount: 7499,
      currency: 'USD',
      customer: customerId,
      shippingAddress: addressUS,
      items: orderItems,
      status: 'completed',
      transactions: [txn.id],
    } as any,
  })

  await ctx.payload.create({
    collection: 'orders',
    data: {
      amount: 7499,
      currency: 'USD',
      customer: customerId,
      shippingAddress: addressUS,
      items: orderItems,
      status: 'processing',
      transactions: [txn.id],
    } as any,
  })
}

// ──────────────────────────────────────────────
// Step 9: Globals
// ──────────────────────────────────────────────

async function stepGlobals(ctx: SeedContext) {
  ctx.payload.logger.info('— Seeding globals...')

  await Promise.all([
    ctx.payload.updateGlobal({ slug: 'header', data: headerData }),
    ctx.payload.updateGlobal({ slug: 'footer', data: footerData }),
  ])
}
