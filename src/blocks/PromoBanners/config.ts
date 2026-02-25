import { link } from '@/fields/link'
import type { Block } from 'payload'

export const PromoBanners: Block = {
  slug: 'promoBanners',
  fields: [
    {
      name: 'banners',
      type: 'array',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'subtitle',
          type: 'text',
        },
        {
          name: 'media',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        link({
          appearances: false,
        }),
      ],
      minRows: 1,
      maxRows: 3,
    },
  ],
  interfaceName: 'PromoBannersBlock',
}
