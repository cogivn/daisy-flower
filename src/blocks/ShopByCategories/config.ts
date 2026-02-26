import { link } from '@/fields/link'
import type { Block } from 'payload'

export const ShopByCategories: Block = {
  slug: 'shopByCategories',
  interfaceName: 'ShopByCategoriesBlock',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      defaultValue: 'Shop By Categories',
      admin: {
        description: 'Section heading.',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Subtitle or short intro below the heading.',
      },
    },
    link({
      appearances: false,
      overrides: {
        name: 'exploreMoreLink',
        admin: {
          description: 'Main "Explore More" button (top right).',
        },
      },
    }),
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      required: true,
      maxRows: 4,
      admin: {
        description: 'Categories to show as cards (max 4 for a 2×2 grid).',
      },
    },
  ],
}
