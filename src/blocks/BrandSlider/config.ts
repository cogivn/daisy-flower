import type { Block } from 'payload'

export const BrandSlider: Block = {
  slug: 'brandSlider',
  fields: [
    {
      name: 'brands',
      type: 'relationship',
      relationTo: 'brands',
      hasMany: true,
      required: true,
    },
  ],
  interfaceName: 'BrandSliderBlock',
}
