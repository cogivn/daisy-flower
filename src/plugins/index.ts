import { ecommercePlugin } from '@payloadcms/plugin-ecommerce'
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { APIError, Plugin } from 'payload'

import { stripeAdapter } from '@payloadcms/plugin-ecommerce/payments/stripe'

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
    addresses: {
      addressesCollectionOverride: ({ defaultCollection }) => ({
        ...defaultCollection,
        access: {
          ...defaultCollection.access,
          read: isDocumentOwner,
          update: isDocumentOwner,
          delete: isDocumentOwner,
        },
      }),
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
        ],
      }),
    },
    customers: {
      slug: 'users',
    },
    orders: {
      ordersCollectionOverride: ({ defaultCollection }) => ({
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
          ...defaultCollection.fields,
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
              description: 'Voucher discount amount (USD).',
            },
          },
          {
            name: 'levelDiscount',
            type: 'number',
            min: 0,
            defaultValue: 0,
            admin: {
              readOnly: true,
              description: 'User level discount amount (USD).',
            },
          },
        ],
      }),
    },
    payments: {
      paymentMethods: [
        stripeAdapter({
          secretKey: process.env.STRIPE_SECRET_KEY!,
          publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
          webhookSecret: process.env.STRIPE_WEBHOOKS_SIGNING_SECRET!,
        }),
      ],
    },
    products: {
      productsCollectionOverride: ProductsCollection,
    },
  }),
]
