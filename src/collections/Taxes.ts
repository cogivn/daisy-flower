import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'

export const Taxes: CollectionConfig = {
  slug: 'taxes',
  admin: {
    useAsTitle: 'name',
    group: 'Ecommerce',
    defaultColumns: ['name', 'rate', 'updatedAt'],
  },
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    // Add any necessary hooks here
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'rate',
      type: 'number',
      required: true,
      min: 0,
      max: 100,
      admin: {
        description: 'Tax rate percentage (0 - 100).',
      },
      defaultValue: 0,
    },
  ],
}
