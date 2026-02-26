import { link } from '@/fields/link'
import type { Block } from 'payload'

export const SaleOffer: Block = {
  slug: 'saleOffer',
  interfaceName: 'SaleOfferBlock',
  fields: [
    {
      name: 'sectionTitle',
      type: 'text',
      label: 'Section heading',
      admin: {
        description: 'Optional title above the offer (e.g. "Limited Time Offer").',
      },
    },
    {
      name: 'sectionDescription',
      type: 'textarea',
      label: 'Section description',
      admin: {
        description: 'Optional short intro below the heading.',
      },
    },
    {
      name: 'productLabel',
      type: 'text',
      label: 'Side label',
      defaultValue: 'Backpack',
    },
    {
      name: 'gallery',
      type: 'array',
      label: 'Product images',
      minRows: 1,
      maxRows: 5,
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      defaultValue: 'BLINGO BACKPACK',
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'originalPrice',
          type: 'number',
          label: 'Original price',
          admin: {
            description: 'Price before sale. When countdown is active, shown with sale price; when expired, only this is shown.',
          },
        },
        {
          name: 'price',
          type: 'number',
          required: true,
          label: 'Sale price',
        },
        {
          name: 'currency',
          type: 'text',
          label: 'Currency symbol',
          defaultValue: '$',
        },
        {
          name: 'rating',
          type: 'number',
          label: 'Rating (0-5)',
          min: 0,
          max: 5,
          defaultValue: 5,
        },
      ],
    },
    {
      name: 'highlight',
      type: 'text',
      label: 'Highlight text',
      defaultValue: "BEST DEAL, LIMITED TIME OFFER GET YOUR'S NOW!",
    },
    {
      name: 'countdown',
      type: 'group',
      label: 'Countdown',
      fields: [
        {
          name: 'enabled',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'targetDate',
          type: 'date',
          label: 'Target date',
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
            condition: (_, siblingData) => Boolean(siblingData?.enabled),
          },
        },
      ],
    },
    {
      name: 'cta',
      type: 'array',
      label: 'Call to action',
      minRows: 0,
      maxRows: 1,
      fields: [
        link({
          appearances: ['default', 'outline'],
        }),
      ],
    },
  ],
}

