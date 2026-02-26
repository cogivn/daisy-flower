import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const SaleEvents: CollectionConfig = {
  slug: 'sale-events',
  labels: {
    singular: 'Sale event',
    plural: 'Sale events',
  },
  admin: {
    useAsTitle: 'title',
    group: 'Ecommerce',
    defaultColumns: ['title', 'product', 'status', 'startsAt', 'endsAt'],
  },
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: () => true,
    update: adminOnly,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Internal name for this sale (e.g. Spring bouquet sale).',
      },
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true,
      admin: {
        description: 'Product this sale event applies to.',
        position: 'sidebar',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'salePrice',
          type: 'number',
          required: true,
          admin: {
            description:
              'Sale price in the same unit as the base product price (minor units, e.g. cents). This does not change the original product price.',
          },
        },
        {
          name: 'status',
          type: 'select',
          defaultValue: 'scheduled',
          options: [
            { label: 'Scheduled', value: 'scheduled' },
            { label: 'Active', value: 'active' },
            { label: 'Expired', value: 'expired' },
          ],
          admin: {
            description: 'Status is usually derived from the start / end time, but can be overridden.',
            position: 'sidebar',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'startsAt',
          type: 'date',
          required: true,
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
        {
          name: 'endsAt',
          type: 'date',
          required: true,
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Optional notes for marketing or operations.',
      },
    },
  ],
}

