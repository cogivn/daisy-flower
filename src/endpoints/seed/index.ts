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
  { title: 'Accessories', slug: 'Accessories', description: 'Bags, backpacks and accessories for every style.' },
  { title: 'T-Shirts', slug: 'T-Shirts', description: 'Comfortable tees in multiple colors and sizes.' },
  { title: 'Hats', slug: 'Hats', description: 'Caps and hats to complete your look.' },
  { title: 'Plants', slug: 'Plants', description: 'Indoor and outdoor plants to bring nature into your space.' },
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
  ])

  const [
    customer,
    imageHat,
    imageTshirtBlack,
    imageTshirtWhite,
    imageHero1,
    imageHero2,
    imageHero3,
    accessoriesCategory,
    tshirtsCategory,
    hatsCategory,
    plantsCategory,
  ] = await Promise.all([
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
    ...categorySeedData.map((cat) =>
      payload.create({
        collection: 'categories',
        data: {
          title: cat.title,
          slug: cat.slug,
          description: cat.description,
        },
      }),
    ),
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

  const productHat = await payload.create({
    collection: 'products',
    depth: 0,
    data: productHatData({
      galleryImage: imageHat,
      metaImage: imageHat,
      variantTypes: [colorVariantType],
      categories: [hatsCategory],
      relatedProducts: [],
    }),
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
