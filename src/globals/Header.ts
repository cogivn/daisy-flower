import type { GlobalConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { link } from '@/fields/link'

export const Header: GlobalConfig = {
  slug: 'header',
  access: {
    read: () => true,
    update: adminOnly,
  },
  fields: [
    {
      name: 'topBarContent',
      type: 'text',
      label: 'Top Bar Content',
      defaultValue: 'Free Delivery: Take advantage of our limited time offer!',
    },
    {
      name: 'contactNumber',
      type: 'text',
      label: 'Contact Number',
      defaultValue: '+01 23456789',
    },
    {
      name: 'navItems',
      type: 'array',
      fields: [
        link({
          appearances: false,
        }),
      ],
      maxRows: 6,
    },
    {
      name: 'categories',
      type: 'array',
      label: 'Categories Menu',
      fields: [
        link({
          appearances: false,
        }),
      ],
    },
  ],
}
