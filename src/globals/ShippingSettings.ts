import type { GlobalConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const ShippingSettings: GlobalConfig = {
  slug: 'shipping-settings',
  label: 'Shipping Settings',
  admin: {
    group: 'Settings',
    description:
      'Configure standard shipping fees, thresholds for free shipping, and pickup settings.',
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
    {
      name: 'pickup',
      type: 'group',
      label: 'Pickup',
      admin: {
        description: 'Store pickup location shown during checkout pickup flow.',
      },
      fields: [
        {
          name: 'locationName',
          type: 'text',
          required: true,
          defaultValue: 'Daisy Flower Main Store',
        },
        {
          name: 'locationAddress',
          type: 'text',
          required: true,
          defaultValue: '123 Le Loi Street, District 1, Ho Chi Minh City',
        },
      ],
    },
  ],
}
