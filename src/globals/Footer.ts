import type { GlobalConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { link } from '@/fields/link'

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: {
    read: () => true,
    update: adminOnly,
  },
  fields: [
    {
      name: 'brandDescription',
      type: 'text',
      label: 'Brand Description',
      defaultValue:
        'We are a team of designers and developers that create high quality plants and flower shop themes for your business.',
    },
    {
      name: 'sections',
      type: 'array',
      label: 'Column Sections',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'navItems',
          type: 'array',
          fields: [
            link({
              appearances: false,
            }),
          ],
        },
      ],
      maxRows: 4,
    },
    {
      name: 'openingHours',
      type: 'array',
      label: 'Opening Hours',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'day',
              type: 'text',
              admin: { width: '50%' },
            },
            {
              name: 'hours',
              type: 'text',
              admin: { width: '50%' },
            },
          ],
        },
      ],
    },
    {
      name: 'copyrightText',
      type: 'text',
      label: 'Copyright Text (after year)',
      defaultValue: 'LUKANI. Made with ❤️ for plants.',
    },
  ],
}
