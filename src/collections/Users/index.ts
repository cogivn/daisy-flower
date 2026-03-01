import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { adminOnlyFieldAccess } from '@/access/adminOnlyFieldAccess'
import { adminOrSelf } from '@/access/adminOrSelf'
import { publicAccess } from '@/access/publicAccess'
import { checkRole } from '@/access/utilities'
import { USER_LEVELS } from '@/config/userLevels'

import { ensureFirstUserIsAdmin } from './hooks/ensureFirstUserIsAdmin'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: ({ req: { user } }) => checkRole(['admin'], user),
    create: publicAccess,
    delete: adminOnly,
    read: adminOrSelf,
    unlock: adminOnly,
    update: adminOrSelf,
  },
  admin: {
    group: 'Users',
    defaultColumns: ['name', 'email', 'roles', 'level'],
    useAsTitle: 'name',
  },
  auth: {
    tokenExpiration: 1209600,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'roles',
      type: 'select',
      access: {
        create: adminOnlyFieldAccess,
        read: adminOnlyFieldAccess,
        update: adminOnlyFieldAccess,
      },
      defaultValue: ['customer'],
      hasMany: true,
      hooks: {
        beforeChange: [ensureFirstUserIsAdmin],
      },
      options: [
        {
          label: 'admin',
          value: 'admin',
        },
        {
          label: 'customer',
          value: 'customer',
        },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'level',
      type: 'select',
      defaultValue: 'bronze',
      options: USER_LEVELS.map((l) => ({
        label: l.charAt(0).toUpperCase() + l.slice(1),
        value: l,
      })),
      saveToJWT: true,
      access: {
        update: adminOnlyFieldAccess,
      },
      admin: {
        description: 'Auto-calculated from total spending. Admin can override.',
        position: 'sidebar',
      },
    },
    {
      name: 'levelLocked',
      type: 'checkbox',
      defaultValue: false,
      access: {
        read: adminOnlyFieldAccess,
        update: adminOnlyFieldAccess,
      },
      admin: {
        description: 'Prevents auto-downgrade only. Auto-cleared when user upgrades.',
        position: 'sidebar',
      },
    },
    {
      name: 'totalSpent',
      type: 'number',
      defaultValue: 0,
      min: 0,
      access: {
        update: adminOnlyFieldAccess,
      },
      admin: {
        description: 'Total spent on completed orders (VND). Auto-calculated.',
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'orders',
      type: 'join',
      collection: 'orders',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['createdAt', 'total', 'currency', 'items'],
      },
    },
    {
      name: 'cart',
      type: 'join',
      collection: 'carts',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['createdAt', 'total', 'currency', 'items'],
      },
    },
    {
      name: 'addresses',
      type: 'join',
      collection: 'addresses',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['firstName', 'lastName', 'addressLine1', 'city', 'phone'],
      },
    },
    {
      name: 'wishlist',
      type: 'join',
      collection: 'wishlist',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['product', 'createdAt'],
      },
    },
  ],
}
