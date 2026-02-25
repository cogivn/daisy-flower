import type { Block } from 'payload'

export const CategoryCarousel: Block = {
  slug: 'categoryCarousel',
  fields: [
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      required: true,
    },
  ],
  interfaceName: 'CategoryCarouselBlock',
}
