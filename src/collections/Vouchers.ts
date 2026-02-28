import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { USER_LEVELS } from '@/config/userLevels'

function generateVoucherCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const segment = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `${segment(4)}-${segment(4)}`
}

export const Vouchers: CollectionConfig = {
  slug: 'vouchers',
  labels: {
    singular: 'Voucher',
    plural: 'Vouchers',
  },
  admin: {
    useAsTitle: 'code',
    group: 'Ecommerce',
    defaultColumns: ['code', 'type', 'value', 'scope', '_status', 'usedCount', 'validTo'],
    description: 'Discount codes customers can apply at checkout.',
  },
  versions: {
    drafts: true,
  },
  access: {
    create: adminOnly,
    read: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  hooks: {
    beforeValidate: [
      ({ data, operation }) => {
        if (operation === 'create' && data && !data.code) {
          data.code = generateVoucherCode()
        }
        if (data?.code) {
          data.code = data.code.toUpperCase().trim()
        }
        if (data?.type === 'percent' && data?.value != null && data.value > 100) {
          data.value = 100
        }
        // Skip strict validation for drafts
        if (data?._status === 'draft') return data

        if (data?.scope === 'specific') {
          const products = data.applicableProducts
          if (!products || (Array.isArray(products) && products.length === 0)) {
            throw new Error('Specific scope requires at least one product.')
          }
        }
        if (data?.validFrom && data?.validTo && new Date(data.validFrom) >= new Date(data.validTo)) {
          throw new Error('validFrom must be before validTo.')
        }
        if (data?.assignMode === 'level') {
          const levels = data.allowedUserLevels
          if (!levels || (Array.isArray(levels) && levels.length === 0)) {
            throw new Error('By User Level requires at least one level selected.')
          }
        }
        if (data?.assignMode === 'users') {
          const users = data.assignedUsers
          if (!users || (Array.isArray(users) && users.length === 0)) {
            throw new Error('Specific Users requires at least one user selected.')
          }
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'code',
      type: 'text',
      unique: true,
      required: true,
      index: true,
      admin: {
        position: 'sidebar',
        description:
          'Voucher code. Leave empty to auto-generate (e.g. XKPR-4M2N). Override with a custom code if needed.',
      },
    },

    // --- Discount config ---
    {
      type: 'row',
      fields: [
        {
          name: 'type',
          type: 'select',
          required: true,
          defaultValue: 'percent',
          options: [
            { label: 'Percentage (%)', value: 'percent' },
            { label: 'Fixed Amount ($)', value: 'fixed' },
          ],
          admin: { width: '33%' },
        },
        {
          name: 'value',
          type: 'number',
          required: true,
          min: 0,
          admin: {
            description: 'Discount value. For percent: 20 = 20%. For fixed: 10 = $10 off.',
            width: '33%',
          },
        },
        {
          name: 'maxDiscount',
          type: 'number',
          min: 0,
          admin: {
            description: 'Max discount cap for percent type (e.g. 50 = max $50 off). Leave empty for no cap.',
            width: '33%',
            condition: (data) => data?.type === 'percent',
          },
        },
      ],
    },

    // --- Scope ---
    {
      name: 'scope',
      type: 'select',
      required: true,
      defaultValue: 'all',
      options: [
        { label: 'Entire Order', value: 'all' },
        { label: 'Specific Products', value: 'specific' },
      ],
      admin: {
        description: 'Apply to entire order or only selected products.',
      },
    },
    {
      name: 'applicableProducts',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      admin: {
        description: 'Select products this voucher applies to.',
        condition: (data) => data?.scope === 'specific',
      },
    },

    // --- Usage limits ---
    {
      type: 'row',
      fields: [
        {
          name: 'minOrderAmount',
          type: 'number',
          min: 0,
          admin: {
            description: 'Minimum order subtotal to use this voucher (USD). Leave empty for no minimum.',
            width: '33%',
          },
        },
        {
          name: 'maxUses',
          type: 'number',
          min: 1,
          admin: {
            description: 'Total uses allowed across all users. Leave empty for unlimited.',
            width: '33%',
          },
        },
        {
          name: 'maxUsesPerUser',
          type: 'number',
          min: 1,
          admin: {
            description: 'Max uses per user. Leave empty for unlimited.',
            width: '33%',
          },
        },
      ],
    },
    {
      name: 'usedCount',
      type: 'number',
      defaultValue: 0,
      min: 0,
      admin: {
        readOnly: true,
        description: 'How many times this voucher has been used.',
        position: 'sidebar',
      },
    },

    // --- Validity period ---
    {
      type: 'row',
      fields: [
        {
          name: 'validFrom',
          type: 'date',
          admin: {
            description: 'Start date. Leave empty for immediate.',
            date: { pickerAppearance: 'dayAndTime' },
            width: '50%',
          },
        },
        {
          name: 'validTo',
          type: 'date',
          admin: {
            description: 'Expiry date. Leave empty for no expiry.',
            date: { pickerAppearance: 'dayAndTime' },
            width: '50%',
          },
        },
      ],
    },

    // --- Who can use ---
    {
      name: 'assignMode',
      type: 'select',
      required: true,
      defaultValue: 'all',
      options: [
        { label: 'All Users', value: 'all' },
        { label: 'By User Level', value: 'level' },
        { label: 'Specific Users', value: 'users' },
      ],
      admin: {
        description: 'Who can use this voucher.',
      },
    },
    {
      name: 'allowedUserLevels',
      type: 'select',
      hasMany: true,
      options: USER_LEVELS.map((l) => ({
        label: l.charAt(0).toUpperCase() + l.slice(1),
        value: l,
      })),
      admin: {
        description: 'Only these levels can use this voucher.',
        condition: (data) => data?.assignMode === 'level',
      },
    },
    {
      name: 'assignedUsers',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      admin: {
        description: 'Select specific users who can use this voucher.',
        condition: (data) => data?.assignMode === 'users',
      },
    },

    // --- Internal ---
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Internal notes about this voucher campaign.',
      },
    },
  ],
}
