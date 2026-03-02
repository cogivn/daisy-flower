import type { GlobalConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const TaxSettings: GlobalConfig = {
  slug: 'tax-settings',
  label: 'Tax Settings',
  admin: {
    group: 'Settings',
    description: 'Configure how taxes are applied globally (or disable default tax).',
  },
  access: {
    read: () => true,
    update: adminOnly,
  },
  fields: [
    {
      name: 'taxMode',
      type: 'select',
      required: true,
      defaultValue: 'exclusive',
      options: [
        {
          label: 'Exclusive (Tax is added to the subtotal)',
          value: 'exclusive',
        },
        {
          label: 'Inclusive (Price already includes tax)',
          value: 'inclusive',
        },
      ],
      admin: {
        description:
          'Exclusive: tax is added on top of the subtotal. Inclusive: prices are tax-inclusive and tax is backed out for reporting.',
      },
    },
    {
      name: 'defaultTaxClasses',
      type: 'relationship',
      relationTo: 'taxes',
      hasMany: true,
      required: false,
      admin: {
        description:
          'Optional. Used as global fallback tax classes for products/categories without specific tax. Ignored when tax mode is Inclusive.',
        condition: (_, siblingData) => siblingData?.taxMode === 'exclusive',
      },
    },
  ],
}
