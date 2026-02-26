import type { File, Payload, PayloadRequest } from 'payload'

import type { Cart } from '@/payload-types'
import { Address, Transaction, VariantOption } from '@/payload-types'
import { contactFormData } from './contact-form'
import { contactPageData } from './contact-page'
import { homePageData } from './home'
import { imageHatData } from './image-hat'
import { imageHero1Data } from './image-hero-1'
import { imageHero2Data } from './image-hero-2'
import { imageHero3Data } from './image-hero-3'
import { imageTshirtBlackData } from './image-tshirt-black'
import { imageTshirtWhiteData } from './image-tshirt-white'
import { productHatData } from './product-hat'
import { productTshirtData, productTshirtVariant } from './product-tshirt'
import { resetDatabase } from './reset'

const categorySeedData = [
  {
    title: 'Bouquets',
    slug: 'bouquets',
    description: 'Hand-tied flower bouquets for birthdays, anniversaries and every occasion.',
  },
  {
    title: 'Indoor Plants',
    slug: 'indoor-plants',
    description: 'Low‑maintenance indoor plants to bring fresh greenery into your home.',
  },
  {
    title: 'Outdoor Plants',
    slug: 'outdoor-plants',
    description: 'Hardy outdoor plants that thrive on balconies, terraces and in gardens.',
  },
  {
    title: 'Dried Flowers',
    slug: 'dried-flowers',
    description: 'Long‑lasting dried and preserved arrangements that stay beautiful for months.',
  },
  {
    title: 'Flower Accessories',
    slug: 'flower-accessories',
    description: 'Vases, ribbons, cards and add‑ons to complete your floral gift.',
  },
  {
    title: 'Gift Boxes',
    slug: 'gift-boxes',
    description: 'Curated gift boxes with flowers, candles and sweet treats.',
  },
  {
    title: 'Wedding Flowers',
    slug: 'wedding-flowers',
    description: 'Bridal bouquets, boutonnieres and ceremony florals for your big day.',
  },
  {
    title: 'Birthday Flowers',
    slug: 'birthday-flowers',
    description: 'Bright and joyful arrangements designed specifically for birthday celebrations.',
  },
  {
    title: 'Sympathy & Condolences',
    slug: 'sympathy-flowers',
    description: 'Soft, respectful arrangements to express sympathy and support.',
  },
  {
    title: 'Office & Corporate',
    slug: 'office-corporate',
    description: 'Weekly office flowers and corporate gifts to keep workspaces fresh.',
  },
]

const sizeVariantOptions = [
  { label: 'Small', value: 'small' },
  { label: 'Medium', value: 'medium' },
  { label: 'Large', value: 'large' },
  { label: 'X Large', value: 'xlarge' },
]

const colorVariantOptions = [
  { label: 'Black', value: 'black' },
  { label: 'White', value: 'white' },
]

const baseAddressUSData: Transaction['billingAddress'] = {
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

const baseAddressUKData: Transaction['billingAddress'] = {
  title: 'Mr.',
  firstName: 'Oliver',
  lastName: 'Twist',
  phone: '1234567890',
  addressLine1: '48 Great Portland St',
  city: 'London',
  postalCode: 'W1W 7ND',
  country: 'GB',
}

// Next.js revalidation errors are normal when seeding the database without a server running
// i.e. running `yarn seed` locally instead of using the admin UI within an active app
// The app is not running to revalidate the pages and so the API routes are not available
// These error messages can be ignored: `Error hitting revalidate route for...`
export const seed = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  payload.logger.info('Seeding database...')

  // clear collections and globals before seeding
  await resetDatabase({ payload, req })

  payload.logger.info(`— Seeding customer and customer data...`)

  await payload.delete({
    collection: 'users',
    depth: 0,
    where: {
      email: {
        equals: 'customer@example.com',
      },
    },
  })

  payload.logger.info(`— Seeding media...`)

  const [
    imageHatBuffer,
    imageTshirtBlackBuffer,
    imageTshirtWhiteBuffer,
    hero1Buffer,
    hero2Buffer,
    hero3Buffer,
    product1Buffer,
    product2Buffer,
    product3Buffer,
    product4Buffer,
    product5Buffer,
    product6Buffer,
    product7Buffer,
    product8Buffer,
    product9Buffer,
    product10Buffer,
    product11Buffer,
    product12Buffer,
    banner1Buffer,
    banner2Buffer,
    banner3Buffer,
    banner4Buffer,
    banner5Buffer,
    banner6Buffer,
  ] = await Promise.all([
    fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/ecommerce/src/endpoints/seed/hat-logo.png',
    ),
    fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/ecommerce/src/endpoints/seed/tshirt-black.png',
    ),
    fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/ecommerce/src/endpoints/seed/tshirt-white.png',
    ),
    fetchFileByURL('https://template.hasthemes.com/lukani/lukani/assets/img/slider/slider1.jpg'),
    fetchFileByURL('https://template.hasthemes.com/lukani/lukani/assets/img/slider/slider2.jpg'),
    fetchFileByURL('https://template.hasthemes.com/lukani/lukani/assets/img/slider/slider3.jpg'),
    fetchFileByURL('https://template.hasthemes.com/lukani/lukani/assets/img/product/product1.jpg'),
    fetchFileByURL('https://template.hasthemes.com/lukani/lukani/assets/img/product/product2.jpg'),
    fetchFileByURL('https://template.hasthemes.com/lukani/lukani/assets/img/product/product3.jpg'),
    fetchFileByURL('https://template.hasthemes.com/lukani/lukani/assets/img/product/product4.jpg'),
    fetchFileByURL('https://template.hasthemes.com/lukani/lukani/assets/img/product/product5.jpg'),
    fetchFileByURL('https://template.hasthemes.com/lukani/lukani/assets/img/product/product6.jpg'),
    fetchFileByURL('https://template.hasthemes.com/lukani/lukani/assets/img/product/product7.jpg'),
    fetchFileByURL('https://template.hasthemes.com/lukani/lukani/assets/img/product/product8.jpg'),
    fetchFileByURL('https://template.hasthemes.com/lukani/lukani/assets/img/product/product9.jpg'),
    fetchFileByURL('https://template.hasthemes.com/lukani/lukani/assets/img/product/product10.jpg'),
    fetchFileByURL('https://template.hasthemes.com/lukani/lukani/assets/img/product/product11.jpg'),
    fetchFileByURL('https://template.hasthemes.com/lukani/lukani/assets/img/product/product12.jpg'),
    fetchFileByURL('https://template.hasthemes.com/lukani/lukani/assets/img/bg/banner1.jpg'),
    fetchFileByURL('https://template.hasthemes.com/lukani/lukani/assets/img/bg/banner2.jpg'),
    fetchFileByURL('https://template.hasthemes.com/lukani/lukani/assets/img/bg/banner3.jpg'),
    fetchFileByURL('https://template.hasthemes.com/lukani/lukani/assets/img/bg/banner4.jpg'),
    fetchFileByURL('https://template.hasthemes.com/lukani/lukani/assets/img/bg/banner5.jpg'),
    fetchFileByURL('https://template.hasthemes.com/lukani/lukani/assets/img/bg/banner6.jpg'),
  ])

  const [customer, imageHat, imageTshirtBlack, imageTshirtWhite, imageHero1, imageHero2, imageHero3] =
    await Promise.all([
    payload.create({
      collection: 'users',
      data: {
        name: 'Customer',
        email: 'customer@example.com',
        password: 'password',
        roles: ['customer'],
      },
    }),
    payload.create({
      collection: 'media',
      data: imageHatData,
      file: imageHatBuffer,
    }),
    payload.create({
      collection: 'media',
      data: imageTshirtBlackData,
      file: imageTshirtBlackBuffer,
    }),
    payload.create({
      collection: 'media',
      data: imageTshirtWhiteData,
      file: imageTshirtWhiteBuffer,
    }),
    payload.create({
      collection: 'media',
      data: imageHero1Data,
      file: hero1Buffer,
    }),
    payload.create({
      collection: 'media',
      data: imageHero2Data,
      file: hero2Buffer,
    }),
    payload.create({
      collection: 'media',
      data: imageHero3Data,
      file: hero3Buffer,
    }),
  ])

  // Seed category banner images (banner1.jpg - banner6.jpg)
  const bannerBuffers = [banner1Buffer, banner2Buffer, banner3Buffer, banner4Buffer, banner5Buffer, banner6Buffer]

  const bannerMediaDocs = await Promise.all(
    bannerBuffers.map((file, index) =>
      payload.create({
        collection: 'media',
        data: { alt: `Category banner ${index + 1}` },
        file,
      }),
    ),
  )

  // Seed categories and attach banner images to the first six
  const categoryDocs = await Promise.all(
    categorySeedData.map((cat, index) => {
      const banner = bannerMediaDocs[index]

      return payload.create({
        collection: 'categories',
        data: {
          title: cat.title,
          slug: cat.slug,
          description: cat.description,
          ...(banner ? { image: banner.id } : {}),
        },
      })
    }),
  )

  const [accessoriesCategory, tshirtsCategory, hatsCategory, plantsCategory] = categoryDocs

  // Seed additional product images (product1.jpg - product12.jpg) into the media library
  const productMediaDocs = await Promise.all([
    payload.create({
      collection: 'media',
      data: { alt: 'Lukani product 1' },
      file: product1Buffer,
    }),
    payload.create({
      collection: 'media',
      data: { alt: 'Lukani product 2' },
      file: product2Buffer,
    }),
    payload.create({
      collection: 'media',
      data: { alt: 'Lukani product 3' },
      file: product3Buffer,
    }),
    payload.create({
      collection: 'media',
      data: { alt: 'Lukani product 4' },
      file: product4Buffer,
    }),
    payload.create({
      collection: 'media',
      data: { alt: 'Lukani product 5' },
      file: product5Buffer,
    }),
    payload.create({
      collection: 'media',
      data: { alt: 'Lukani product 6' },
      file: product6Buffer,
    }),
    payload.create({
      collection: 'media',
      data: { alt: 'Lukani product 7' },
      file: product7Buffer,
    }),
    payload.create({
      collection: 'media',
      data: { alt: 'Lukani product 8' },
      file: product8Buffer,
    }),
    payload.create({
      collection: 'media',
      data: { alt: 'Lukani product 9' },
      file: product9Buffer,
    }),
    payload.create({
      collection: 'media',
      data: { alt: 'Lukani product 10' },
      file: product10Buffer,
    }),
    payload.create({
      collection: 'media',
      data: { alt: 'Lukani product 11' },
      file: product11Buffer,
    }),
    payload.create({
      collection: 'media',
      data: { alt: 'Lukani product 12' },
      file: product12Buffer,
    }),
  ])

  payload.logger.info(`— Seeding variant types and options...`)

  const sizeVariantType = await payload.create({
    collection: 'variantTypes',
    data: {
      name: 'size',
      label: 'Size',
    },
  })

  const sizeVariantOptionsResults: VariantOption[] = []

  for (const option of sizeVariantOptions) {
    const result = await payload.create({
      collection: 'variantOptions',
      data: {
        ...option,
        variantType: sizeVariantType.id,
      },
    })
    sizeVariantOptionsResults.push(result)
  }

  const [small, medium, large, xlarge] = sizeVariantOptionsResults

  const colorVariantType = await payload.create({
    collection: 'variantTypes',
    data: {
      name: 'color',
      label: 'Color',
    },
  })

  const [black, white] = await Promise.all(
    colorVariantOptions.map((option) => {
      return payload.create({
        collection: 'variantOptions',
        data: {
          ...option,
          variantType: colorVariantType.id,
        },
      })
    }),
  )

  payload.logger.info(`— Seeding products...`)

  const hatGalleryImages = Array.from({ length: 5 }).map((_, index) => {
    const doc = productMediaDocs[index % productMediaDocs.length]
    return { image: doc.id }
  })

  const productHat = await payload.create({
    collection: 'products',
    depth: 0,
    data: {
      ...productHatData({
        galleryImage: imageHat,
        metaImage: imageHat,
        variantTypes: [colorVariantType],
        categories: [hatsCategory],
        relatedProducts: [],
      }),
      gallery: hatGalleryImages,
    },
  })

  const productTshirt = await payload.create({
    collection: 'products',
    depth: 0,
    data: productTshirtData({
      galleryImages: [
        { image: imageTshirtBlack, variantOption: black },
        { image: imageTshirtWhite, variantOption: white },
      ],
      metaImage: imageTshirtBlack,
      contentImage: imageHero1,
      variantTypes: [colorVariantType, sizeVariantType],
      categories: [tshirtsCategory],
      relatedProducts: [productHat],
    }),
  })

  let hoodieID: number | string = productTshirt.id

  if (payload.db.defaultIDType === 'text') {
    hoodieID = `"${hoodieID}"`
  }

  const [
    smallTshirtHoodieVariant,
    mediumTshirtHoodieVariant,
    largeTshirtHoodieVariant,
    xlargeTshirtHoodieVariant,
  ] = await Promise.all(
    [small, medium, large, xlarge].map((variantOption) =>
      payload.create({
        collection: 'variants',
        depth: 0,
        data: productTshirtVariant({
          product: productTshirt,
          variantOptions: [variantOption, white],
        }),
      }),
    ),
  )

  await Promise.all(
    [small, medium, large, xlarge].map((variantOption) =>
      payload.create({
        collection: 'variants',
        depth: 0,
        data: productTshirtVariant({
          product: productTshirt,
          variantOptions: [variantOption, black],
          ...(variantOption.value === 'medium' ? { inventory: 0 } : {}),
        }),
      }),
    ),
  )

  // Additional simple flower products using Lukani product images
  const additionalProductsData = [
    {
      title: 'Sunrise Tulip Bouquet',
      slug: 'sunrise-tulip-bouquet',
      priceInUSD: 4599,
      category: hatsCategory,
      imageIndex: 1,
    },
    {
      title: 'Lavender Dream Box',
      slug: 'lavender-dream-box',
      priceInUSD: 5299,
      category: plantsCategory,
      imageIndex: 2,
    },
    {
      title: 'Pastel Garden Arrangement',
      slug: 'pastel-garden-arrangement',
      priceInUSD: 6199,
      category: hatsCategory,
      imageIndex: 3,
    },
    {
      title: 'Monstera Deluxe Planter',
      slug: 'monstera-deluxe-planter',
      priceInUSD: 7499,
      category: plantsCategory,
      imageIndex: 4,
    },
    {
      title: 'White Orchid Duo',
      slug: 'white-orchid-duo',
      priceInUSD: 8999,
      category: plantsCategory,
      imageIndex: 5,
    },
    {
      title: 'Blush Peony Bouquet',
      slug: 'blush-peony-bouquet',
      priceInUSD: 6899,
      category: hatsCategory,
      imageIndex: 6,
    },
    {
      title: 'Eucalyptus Cloud Vase',
      slug: 'eucalyptus-cloud-vase',
      priceInUSD: 3999,
      category: plantsCategory,
      imageIndex: 7,
    },
    {
      title: 'Classic Red Roses',
      slug: 'classic-red-roses',
      priceInUSD: 5599,
      category: hatsCategory,
      imageIndex: 8,
    },
    {
      title: 'Herb Kitchen Trio',
      slug: 'herb-kitchen-trio',
      priceInUSD: 3499,
      category: plantsCategory,
      imageIndex: 9,
    },
    {
      title: 'Golden Sunflower Bundle',
      slug: 'golden-sunflower-bundle',
      priceInUSD: 4299,
      category: hatsCategory,
      imageIndex: 10,
    },
    {
      title: 'Minimalist Fern Pot',
      slug: 'minimalist-fern-pot',
      priceInUSD: 2799,
      category: plantsCategory,
      imageIndex: 11,
    },
    {
      title: 'Sweet Pastel Gift Box',
      slug: 'sweet-pastel-gift-box',
      priceInUSD: 5899,
      category: hatsCategory,
      imageIndex: 12,
    },
    {
      title: 'Spring Meadow Bouquet',
      slug: 'spring-meadow-bouquet',
      priceInUSD: 4799,
      category: hatsCategory,
      imageIndex: 3,
    },
    {
      title: 'Trailing Ivy Shelf Plant',
      slug: 'trailing-ivy-shelf-plant',
      priceInUSD: 3299,
      category: plantsCategory,
      imageIndex: 4,
    },
    {
      title: 'Blossom Gift Basket',
      slug: 'blossom-gift-basket',
      priceInUSD: 6199,
      category: hatsCategory,
      imageIndex: 5,
    },
    {
      title: 'Mini Cactus Collection',
      slug: 'mini-cactus-collection',
      priceInUSD: 2599,
      category: plantsCategory,
      imageIndex: 6,
    },
    {
      title: 'Romantic Pink Roses',
      slug: 'romantic-pink-roses',
      priceInUSD: 5599,
      category: hatsCategory,
      imageIndex: 7,
    },
    {
      title: 'Desk Succulent Duo',
      slug: 'desk-succulent-duo',
      priceInUSD: 2999,
      category: plantsCategory,
      imageIndex: 8,
    },
  ]

  await Promise.all(
    additionalProductsData.map(async (item) => {
      const mediaDoc = productMediaDocs[(item.imageIndex - 1) % productMediaDocs.length]

      const galleryImages = Array.from({ length: 5 }).map((_, index) => {
        const doc =
          productMediaDocs[(item.imageIndex - 1 + index) % productMediaDocs.length]
        return { image: doc.id }
      })

      await payload.create({
        collection: 'products',
        depth: 0,
        data: {
          _status: 'published',
          title: item.title,
          slug: item.slug,
          categories: [item.category],
          enableVariants: false,
          priceInUSDEnabled: true,
          priceInUSD: item.priceInUSD,
          gallery: galleryImages,
          meta: {
            title: item.title,
            description: item.title,
            image: mediaDoc.id,
          },
        },
      })
    }),
  )

  // Seed a sample active sale event for one product
  const now = new Date()
  const startsAt = new Date(now.getTime() - 60 * 60 * 1000).toISOString() // started 1 hour ago
  const endsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() // ends in 7 days

  const basePrice =
    typeof (productHat as any).priceInUSD === 'number' ? (productHat as any).priceInUSD : 4999

  const hatSaleEvent = await payload.create({
    collection: 'sale-events',
    data: {
      title: 'Aurora Rose Bouquet Launch Offer',
      product: productHat.id,
      salePrice: Math.max(1, Math.floor(basePrice * 0.8)),
      status: 'active',
      startsAt,
      endsAt,
      notes: 'Seeded example sale event so there is always one product on sale after seeding.',
    },
  })

  await payload.update({
    collection: 'products',
    id: productHat.id,
    data: {
      saleEvents: [hatSaleEvent.id],
    },
  })

  payload.logger.info(`— Seeding contact form...`)

  const contactForm = await payload.create({
    collection: 'forms',
    depth: 0,
    data: contactFormData(),
  })

  payload.logger.info(`— Seeding pages...`)

  const [_, contactPage] = await Promise.all([
    payload.create({
      collection: 'pages',
      depth: 0,
      data: homePageData({
        heroImages: [imageHero1, imageHero2, imageHero3],
        metaImage: imageHat,
        categories: [accessoriesCategory, tshirtsCategory, hatsCategory, plantsCategory],
        product: productHat,
      }),
      context: {
        disableRevalidate: true,
      },
    }),
    payload.create({
      collection: 'pages',
      depth: 0,
      data: contactPageData({
        contactForm: contactForm,
      }),
      context: {
        disableRevalidate: true,
      },
    }),
  ])

  payload.logger.info(`— Seeding addresses...`)

  const customerUSAddress = await payload.create({
    collection: 'addresses',
    depth: 0,
    data: {
      customer: customer.id,
      ...(baseAddressUSData as Address),
    },
  })

  const customerUKAddress = await payload.create({
    collection: 'addresses',
    depth: 0,
    data: {
      customer: customer.id,
      ...(baseAddressUKData as Address),
    },
  })

  payload.logger.info(`— Seeding transactions...`)

  const pendingTransaction = await payload.create({
    collection: 'transactions',
    data: {
      currency: 'USD',
      customer: customer.id,
      paymentMethod: 'stripe',
      stripe: {
        customerID: 'cus_123',
        paymentIntentID: 'pi_123',
      },
      status: 'pending',
      billingAddress: baseAddressUSData,
    },
  })

  const succeededTransaction = await payload.create({
    collection: 'transactions',
    data: {
      currency: 'USD',
      customer: customer.id,
      paymentMethod: 'stripe',
      stripe: {
        customerID: 'cus_123',
        paymentIntentID: 'pi_123',
      },
      status: 'succeeded',
      billingAddress: baseAddressUSData,
    },
  })

  let succeededTransactionID: number | string = succeededTransaction.id

  if (payload.db.defaultIDType === 'text') {
    succeededTransactionID = `"${succeededTransactionID}"`
  }

  payload.logger.info(`— Seeding carts...`)

  // SQLite can return "database is locked" if another process (e.g. dev server) has the DB open. Run seed with dev server stopped.
  const createCartWithRetry = async (data: Record<string, unknown>, retries = 3): Promise<Cart> => {
    for (let i = 0; i < retries; i++) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await payload.create({ collection: 'carts', data: data as any })
        return result as Cart
      } catch (e: unknown) {
        const isLocked =
          e && typeof e === 'object' && 'cause' in e && (e as { cause?: { code?: string } }).cause?.code === 'SQLITE_BUSY'
        if (isLocked && i < retries - 1) {
          await new Promise((r) => setTimeout(r, 300 * (i + 1)))
          continue
        }
        throw e
      }
    }
    throw new Error('createCartWithRetry: unexpected')
  }

  // This cart is open as it's created now
  const openCart = await createCartWithRetry({
    customer: customer.id,
    currency: 'USD',
    items: [
      {
        product: productTshirt.id,
        variant: mediumTshirtHoodieVariant.id,
        quantity: 1,
      },
    ],
  })

  const oldTimestamp = new Date('2023-01-01T00:00:00Z').toISOString()

  // Cart is abandoned because it was created long in the past
  const abandonedCart = await createCartWithRetry({
    currency: 'USD',
    createdAt: oldTimestamp,
    items: [
      {
        product: productHat.id,
        quantity: 1,
      },
    ],
  })

  // Cart is purchased because it has a purchasedAt date
  const completedCart = await payload.create({
    collection: 'carts',
    data: {
      customer: customer.id,
      currency: 'USD',
      purchasedAt: new Date().toISOString(),
      subtotal: 7499,
      items: [
        {
          product: productTshirt.id,
          variant: smallTshirtHoodieVariant.id,
          quantity: 1,
        },
        {
          product: productTshirt.id,
          variant: mediumTshirtHoodieVariant.id,
          quantity: 1,
        },
      ],
    },
  })

  let completedCartID: number | string = completedCart.id

  if (payload.db.defaultIDType === 'text') {
    completedCartID = `"${completedCartID}"`
  }

  payload.logger.info(`— Seeding orders...`)

  const orderInCompleted = await payload.create({
    collection: 'orders',
    data: {
      amount: 7499,
      currency: 'USD',
      customer: customer.id,
      shippingAddress: baseAddressUSData,
      items: [
        {
          product: productTshirt.id,
          variant: smallTshirtHoodieVariant.id,
          quantity: 1,
        },
        {
          product: productTshirt.id,
          variant: mediumTshirtHoodieVariant.id,
          quantity: 1,
        },
      ],
      status: 'completed',
      transactions: [succeededTransaction.id],
    },
  })

  const orderInProcessing = await payload.create({
    collection: 'orders',
    data: {
      amount: 7499,
      currency: 'USD',
      customer: customer.id,
      shippingAddress: baseAddressUSData,
      items: [
        {
          product: productTshirt.id,
          variant: smallTshirtHoodieVariant.id,
          quantity: 1,
        },
        {
          product: productTshirt.id,
          variant: mediumTshirtHoodieVariant.id,
          quantity: 1,
        },
      ],
      status: 'processing',
      transactions: [succeededTransaction.id],
    },
  })

  payload.logger.info(`— Seeding globals...`)

  await Promise.all([
    payload.updateGlobal({
      slug: 'header',
      data: {
        navItems: [
          {
            link: {
              type: 'custom',
              label: 'Home',
              url: '/',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Shop',
              url: '/shop',
            },
          },
        ],
      },
    }),
    payload.updateGlobal({
      slug: 'footer',
      data: {
        brandDescription:
          'We are a team of designers and developers that create high quality plants and flower shop themes for your business.',
        sections: [
          {
            title: 'Information',
            navItems: [
              {
                link: {
                  type: 'custom',
                  label: 'About Us',
                  url: '/about',
                },
              },
              {
                link: {
                  type: 'custom',
                  label: 'Checkout',
                  url: '/checkout',
                },
              },
              {
                link: {
                  type: 'custom',
                  label: 'Contact',
                  url: '/contact',
                },
              },
              {
                link: {
                  type: 'custom',
                  label: 'Frequently Questions',
                  url: '/faq',
                },
              },
            ],
          },
          {
            title: 'My Account',
            navItems: [
              {
                link: {
                  type: 'custom',
                  label: 'My Account',
                  url: '/account',
                },
              },
              {
                link: {
                  type: 'custom',
                  label: 'Shopping Cart',
                  url: '/cart',
                },
              },
              {
                link: {
                  type: 'custom',
                  label: 'Checkout',
                  url: '/checkout',
                },
              },
              {
                link: {
                  type: 'custom',
                  label: 'Shop',
                  url: '/shop',
                },
              },
            ],
          },
        ],
        openingHours: [
          { day: 'Monday - Friday:', hours: '8AM - 10PM' },
          { day: 'Saturday:', hours: '9AM - 8PM' },
          { day: 'Sunday:', hours: 'Closed' },
        ],
        copyrightText: 'LUKANI. Made with ❤️ for plants.',
      },
    }),
  ])

  payload.logger.info('Seeded database successfully!')
}

async function fetchFileByURL(url: string): Promise<File> {
  const res = await fetch(url, {
    credentials: 'include',
    method: 'GET',
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch file from ${url}, status: ${res.status}`)
  }

  const data = await res.arrayBuffer()

  return {
    name: url.split('/').pop() || `file-${Date.now()}`,
    data: Buffer.from(data),
    mimetype: `image/${url.split('.').pop()}`,
    size: data.byteLength,
  }
}
