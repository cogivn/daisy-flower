import type { GlobalConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { USER_LEVELS } from '@/config/userLevels'
import { recalculateUserLevels } from '@/globals/hooks/recalculateUserLevels'

export const UserLevelSettings: GlobalConfig = {
  slug: 'user-level-settings',
  label: 'Level Benefits',
  admin: {
    group: 'Users',
    description: 'Configure spending thresholds and discount benefits for each user level.',
  },
  access: {
    read: () => true,
    update: adminOnly,
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        const levels = data?.levels as Array<{ level?: string }> | undefined
        if (!levels) return data
        const seen = new Set<string>()
        for (const entry of levels) {
          if (entry.level && seen.has(entry.level)) {
            throw new Error(`Duplicate level: "${entry.level}". Each level can only appear once.`)
          }
          if (entry.level) seen.add(entry.level)
        }
        return data
      },
    ],
    afterChange: [recalculateUserLevels],
  },
  fields: [
    {
      name: 'levels',
      type: 'array',
      admin: {
        description:
          'If no levels are configured, auto-upgrade is disabled and all users remain at Bronze. When thresholds are saved, existing users are automatically re-evaluated and upgraded based on their total spending.',
        initCollapsed: false,
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'level',
              type: 'select',
              required: true,
              options: USER_LEVELS.map((l) => ({
                label: l.charAt(0).toUpperCase() + l.slice(1),
                value: l,
              })),
              admin: { width: '25%' },
            },
            {
              name: 'minSpending',
              type: 'number',
              required: true,
              min: 0,
              defaultValue: 0,
              admin: {
                description: 'Min total spent (USD) to reach this level.',
                width: '25%',
              },
            },
            {
              name: 'discountPercent',
              type: 'number',
              required: true,
              min: 0,
              max: 100,
              defaultValue: 0,
              admin: {
                description: 'Discount % at checkout.',
                width: '25%',
              },
            },
            {
              name: 'freeShipping',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description: 'Free shipping?',
                width: '25%',
              },
            },
          ],
        },
        {
          name: 'description',
          type: 'text',
          admin: {
            description: 'Benefit summary shown to customers (e.g. "5% off all orders").',
          },
        },
      ],
    },
  ],
}
