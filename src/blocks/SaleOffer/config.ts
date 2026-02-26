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
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      label: 'Linked product',
      admin: {
        description:
          'Optional. If set, this offer can reuse the product gallery and link to the product detail page.',
        position: 'sidebar',
      },
    },
    {
      name: 'highlight',
      type: 'text',
      label: 'Highlight text',
      defaultValue: "BEST DEAL, LIMITED TIME OFFER GET YOUR'S NOW!",
    },
  ],
}

