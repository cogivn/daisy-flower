import type { GlobalConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const ShippingSettings: GlobalConfig = {
  slug: 'shipping-settings',
  label: 'Shipping Settings',
  admin: {
    group: 'Settings',
    description: 'Configure standard shipping fees and thresholds for free shipping.',
  },
  access: {
    read: () => true,
    update: adminOnly,
  },
  fields: [
    {
      name: 'defaultFee',
      type: 'number',
      required: true,
      min: 0,
      defaultValue: 30000,
      admin: {
        description: 'Standard flat-rate shipping fee (VND).',
      },
    },
    {
      name: 'freeShippingThreshold',
      type: 'number',
      required: true,
      min: 0,
      defaultValue: 500000,
      admin: {
        description:
          'Minimum order amount (after discounts) to qualify for free shipping. If 0, free shipping is disabled (unless user level gives free shipping).',
      },
    },
  ],
}
