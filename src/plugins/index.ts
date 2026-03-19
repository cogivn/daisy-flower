import { ecommercePlugin } from '@payloadcms/plugin-ecommerce'
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { APIError, Plugin } from 'payload'

import { payosAdapter } from '@/payments/payos'
import { stripeAdapter as customStripeAdapter } from '@/payments/stripe'
import { codAdapter } from '@/payments/cod'

import { adminOnlyFieldAccess } from '@/access/adminOnlyFieldAccess'
import { adminOrPublishedStatus } from '@/access/adminOrPublishedStatus'
import { customerOnlyFieldAccess } from '@/access/customerOnlyFieldAccess'
import { isAdmin } from '@/access/isAdmin'
import { isDocumentOwner } from '@/access/isDocumentOwner'
import { ProductsCollection } from '@/collections/Products'
import { applyCartDiscounts } from '@/hooks/carts/applyCartDiscounts'
import { copyVoucherToOrder } from '@/hooks/orders/copyVoucherToOrder'
import { incrementVoucherUsage } from '@/hooks/orders/incrementVoucherUsage'
import { syncUserOnOrderChange } from '@/hooks/orders/syncUserOnOrderChange'
import { Page, Product } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'

const generateTitle: GenerateTitle<Product | Page> = ({ doc }) => {
  return doc?.title ? `${doc.title} | Payload Ecommerce Template` : 'Payload Ecommerce Template'
}

const generateURL: GenerateURL<Product | Page> = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

export const plugins: Plugin[] = [
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
    },
    formSubmissionOverrides: {
      access: {
        delete: isAdmin,
        read: isAdmin,
        update: isAdmin,
      },
      admin: {
        group: 'Content',
      },
      hooks: {
        beforeValidate: [
          async ({ data, req, operation }) => {
            if (operation !== 'create') return data

            const emailField = data?.submissionData?.find?.(
              (field: { field: string; value: string }) => field.field === 'email',
            )

            if (!emailField?.value || !data?.form) return data

            const formID =
              typeof data.form === 'object' && data.form !== null ? data.form.id : data.form

            if (!formID) return data

            // Only enforce de-duplication for the Newsletter form
            const formDoc = await req.payload.findByID({
              collection: 'forms',
              id: formID,
              depth: 0,
            })

            if (formDoc?.title !== 'Newsletter') return data

            const existing = await req.payload.find({
              collection: 'form-submissions',
              where: {
                and: [
                  { form: { equals: formID } },
                  { 'submissionData.field': { equals: 'email' } },
                  { 'submissionData.value': { equals: emailField.value } },
                ],
              },
              limit: 1,
            })

            if (existing.totalDocs > 0) {
              // Signal duplicate subscription without creating a new record
              throw new APIError('newsletter-already-subscribed', 409, null, true)
            }

            return data
          },
        ],
      },
    },
    formOverrides: {
      access: {
        delete: isAdmin,
        read: isAdmin,
        update: isAdmin,
        create: isAdmin,
      },
      admin: {
        group: 'Content',
      },
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'confirmationMessage') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                  ]
                },
              }),
            }
          }
          return field
        })
      },
    },
  }),
  ecommercePlugin({
    access: {
      adminOnlyFieldAccess,
      adminOrPublishedStatus,
      customerOnlyFieldAccess,
      isAdmin,
      isDocumentOwner,
    },
    currencies: {
      defaultCurrency: 'VND',
      supportedCurrencies: [
        {
          code: 'VND',
          decimals: 0,
          label: 'Vietnamese Dong',
          symbol: '₫',
        },
      ],
    },
    addresses: {
      addressFields: ({ defaultFields }: any) => {
        const mapped = (defaultFields as any[]).map((field) => {
          if (!field || typeof field !== 'object') return field

          const name = 'name' in field ? (field.name as string | undefined) : undefined

          // Hide these fields in the admin UI (orders -> Shipping tab),
          // while keeping the underlying data stored.
          if (name && ['addressLine2', 'company', 'city', 'state', 'postalCode'].includes(name)) {
            return {
              ...field,
              admin: {
                ...(field.admin || {}),
                hidden: true,
              },
            }
          }

          // Ensure Vietnam is the default country in admin shipping group.
          if (name === 'country') {
            return {
              ...field,
              defaultValue: 'VN',
              admin: {
                ...(field.admin || {}),
                hidden: true,
              },
            }
          }

          // When shippingType is pickup, hide address (keep only pickupDate/pickupTime).
          if (
            name &&
            ['addressLine1', 'country', 'firstName', 'lastName', 'phone'].includes(name)
          ) {
            return {
              ...field,
              admin: {
                ...(field.admin || {}),
                condition: (data: any) => {
                  const shippingType =
                    data?.shippingType ??
                    (data?.pickupDate || data?.pickupTime ? 'pickup' : 'delivery')
                  return shippingType === 'delivery'
                },
              },
              label: name === 'addressLine1' ? 'Address' : field.label,
            }
          }

          return field
        })

        return [
          ...mapped,
          // Used for pickup schedule (checkout -> admin -> order record).
          {
            name: 'pickupDate',
            type: 'date',
            label: 'Pickup Date',
            admin: {
              width: '50%',
              // Show only when orders shippingType is pickup.
              // Using `data.shippingType` (not siblingData) so it works from `shippingAddress` group.
              condition: (data: any) => data?.shippingType === 'pickup',
            },
          },
          {
            name: 'pickupTime',
            type: 'text',
            label: 'Pickup Time',
            admin: {
              width: '50%',
              // Show only when orders shippingType is pickup.
              condition: (data: any) => data?.shippingType === 'pickup',
            },
          },
        ]
      },
      addressesCollectionOverride: ({ defaultCollection }) => ({
        ...defaultCollection,
        access: {
          ...defaultCollection.access,
          read: isDocumentOwner,
          update: isDocumentOwner,
          delete: isDocumentOwner,
        },
      }),
      supportedCountries: [
        {
          label: 'Vietnam',
          value: 'VN',
        },
      ],
    },
    carts: {
      cartsCollectionOverride: ({ defaultCollection }) => ({
        ...defaultCollection,
        hooks: {
          ...(defaultCollection.hooks || {}),
          beforeChange: [...(defaultCollection.hooks?.beforeChange || []), applyCartDiscounts],
        },
        fields: [
          ...defaultCollection.fields,
          {
            name: 'appliedVoucher',
            type: 'relationship',
            relationTo: 'vouchers',
            admin: {
              readOnly: true,
              position: 'sidebar',
              description: 'Voucher currently applied to this cart.',
            },
          },
          {
            name: 'reservedVoucherExpiresAt',
            type: 'date',
            admin: {
              readOnly: true,
              position: 'sidebar',
              description: 'When the voucher reservation expires (15 min from apply).',
            },
          },
          {
            name: 'voucherCode',
            type: 'text',
            admin: {
              readOnly: true,
              position: 'sidebar',
              description: 'Applied voucher code.',
            },
          },
          {
            name: 'originalSubtotal',
            type: 'number',
            min: 0,
            defaultValue: 0,
            admin: {
              readOnly: true,
              description: 'Subtotal before discounts (auto-calculated).',
            },
          },
          {
            name: 'voucherDiscount',
            type: 'number',
            min: 0,
            defaultValue: 0,
            admin: {
              readOnly: true,
              description: 'Voucher discount amount (auto-calculated).',
            },
          },
          {
            name: 'levelDiscount',
            type: 'number',
            min: 0,
            defaultValue: 0,
            admin: {
              readOnly: true,
              description: 'User level discount amount (auto-calculated).',
            },
          },
          {
            name: 'taxAmount',
            type: 'number',
            min: 0,
            defaultValue: 0,
            admin: {
              readOnly: true,
              description: 'Tax amount (VND).',
            },
          },
          {
            name: 'taxRates',
            type: 'json',
            admin: {
              readOnly: true,
              description: 'Snapshot of tax rates applied.',
            },
          },
          {
            name: 'shippingFee',
            type: 'number',
            min: 0,
            defaultValue: 0,
            admin: {
              readOnly: true,
              description: 'Shipping fee (VND).',
            },
          },
        ],
      }),
    },
    customers: {
      slug: 'users',
    },
    orders: {
      ordersCollectionOverride: ({ defaultCollection }) => {
        const baseFields = (defaultCollection.fields || []).map((field: any) => {
          if (field?.type !== 'tabs' || !Array.isArray(field.tabs)) return field

          return {
            ...field,
            tabs: field.tabs.map((tab: any) => {
              if (!Array.isArray(tab?.fields)) return tab

              const hasShippingAddress = tab.fields.some((f: any) => f?.name === 'shippingAddress')
              if (!hasShippingAddress) return tab

              const hasShippingType = tab.fields.some((f: any) => f?.name === 'shippingType')
              if (hasShippingType) return tab

              const shippingTypeField = {
                name: 'shippingType',
                type: 'select',
                label: 'Shipping Type',
                defaultValue: 'delivery',
                options: [
                  { label: 'Delivery', value: 'delivery' },
                  { label: 'Pickup', value: 'pickup' },
                ],
              }

              return { ...tab, fields: [shippingTypeField, ...tab.fields] }
            }),
          }
        })

        return {
          ...defaultCollection,
          hooks: {
            ...(defaultCollection.hooks || {}),
            beforeChange: [...(defaultCollection.hooks?.beforeChange || []), copyVoucherToOrder],
            afterChange: [
              ...(defaultCollection.hooks?.afterChange || []),
              syncUserOnOrderChange,
              incrementVoucherUsage,
            ],
          },
          fields: [
            ...baseFields,
            {
              name: 'accessToken',
              type: 'text',
              unique: true,
              index: true,
              admin: {
                position: 'sidebar',
                readOnly: true,
              },
              hooks: {
                beforeValidate: [
                  ({ value, operation }) => {
                    if (operation === 'create' || !value) {
                      return crypto.randomUUID()
                    }
                    return value
                  },
                ],
              },
            },
            {
              name: 'voucher',
              type: 'relationship',
              relationTo: 'vouchers',
              admin: {
                readOnly: true,
                position: 'sidebar',
                description: 'Voucher applied to this order.',
              },
            },
            {
              name: 'voucherCode',
              type: 'text',
              admin: {
                readOnly: true,
                position: 'sidebar',
                description: 'Snapshot of voucher code at time of order.',
              },
            },
            {
              name: 'discountAmount',
              type: 'number',
              min: 0,
              defaultValue: 0,
              admin: {
                readOnly: true,
                description: 'Voucher discount amount (VND).',
              },
            },
            {
              name: 'levelDiscount',
              type: 'number',
              min: 0,
              defaultValue: 0,
              admin: {
                readOnly: true,
                description: 'User level discount amount (VND).',
              },
            },
            {
              name: 'taxAmount',
              type: 'number',
              min: 0,
              defaultValue: 0,
              admin: {
                readOnly: true,
                description: 'Tax amount (VND).',
              },
            },
            {
              name: 'taxRates',
              type: 'json',
              admin: {
                readOnly: true,
                description: 'Snapshot of tax rates applied.',
              },
            },
            {
              name: 'shippingFee',
              type: 'number',
              min: 0,
              defaultValue: 0,
              admin: {
                readOnly: true,
                description: 'Shipping fee (VND).',
              },
            },
            {
              name: 'giftMessage',
              type: 'textarea',
              label: 'Gift Message',
              admin: {
                position: 'sidebar',
                description: 'Message from customer for shop note.',
              },
            },
            {
              name: 'orderNotes',
              type: 'textarea',
              label: 'Order Notes',
              admin: {
                position: 'sidebar',
                description: 'Order notes for the shop.',
              },
            },
          ],
        }
      },
    },
    transactions: {
      transactionsCollectionOverride: ({ defaultCollection }) => ({
        ...defaultCollection,
        fields: [
          ...defaultCollection.fields,
          {
            name: 'giftMessage',
            type: 'textarea',
            label: 'Gift Message',
            admin: {
              position: 'sidebar',
              description: 'Message from customer for shop note.',
            },
          },
          {
            name: 'orderNotes',
            type: 'textarea',
            label: 'Order Notes',
            admin: {
              position: 'sidebar',
              description: 'Order notes for the shop.',
            },
          },
          {
            name: 'taxAmount',
            type: 'number',
            min: 0,
            defaultValue: 0,
            admin: {
              position: 'sidebar',
              readOnly: true,
              description: 'Tax amount (VND) snapshot.',
            },
          },
          {
            name: 'taxRates',
            type: 'json',
            admin: {
              position: 'sidebar',
              readOnly: true,
              description: 'Snapshot of tax rates applied.',
            },
          },
          {
            name: 'shippingFee',
            type: 'number',
            min: 0,
            defaultValue: 0,
            admin: {
              position: 'sidebar',
              readOnly: true,
              description: 'Shipping fee (VND) snapshot.',
            },
          },
        ],
      }),
    },
    payments: {
      paymentMethods: [
        payosAdapter({
          clientId: process.env.PAYOS_CLIENT_ID!,
          apiKey: process.env.PAYOS_API_KEY!,
          checksumKey: process.env.PAYOS_CHECKSUM_KEY!,
          returnUrlBase: `${process.env.NEXT_PUBLIC_SERVER_URL}/checkout/confirm-order`,
          cancelUrlBase: `${process.env.NEXT_PUBLIC_SERVER_URL}/checkout`,
          label: 'PayOS',
        }),
        customStripeAdapter({
          secretKey: process.env.STRIPE_SECRET_KEY!,
          publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
          webhookSecret: process.env.STRIPE_WEBHOOKS_SIGNING_SECRET!,
        }),
        codAdapter({
          label: 'Cash on Delivery (COD)',
        } as any),
      ],
    },
    products: {
      productsCollectionOverride: ProductsCollection,
    },
  }),
]
