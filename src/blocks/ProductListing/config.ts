import type { Block } from 'payload'

export const ProductListing: Block = {
  slug: 'productListing',
  interfaceName: 'ProductListingBlock',
  labels: {
    singular: 'Product Listing',
    plural: 'Product Listings',
  },
  fields: [
    {
      name: 'sectionDescription',
      type: 'textarea',
      label: 'Section description',
      admin: {
        description: 'Optional short intro text shown below the section heading.',
      },
    },
    {
      name: 'heading',
      type: 'text',
      required: true,
      defaultValue: 'Products',
      label: 'Section heading',
      admin: {
        description: 'Main title for the product listing section.',
      },
    },
    {
      name: 'enableSearch',
      type: 'checkbox',
      label: 'Enable search input',
      defaultValue: true,
    },
    {
      name: 'tabs',
      type: 'array',
      label: 'Tabs',
      minRows: 1,
      labels: {
        singular: 'Tab',
        plural: 'Tabs',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          label: 'Label',
        },
        {
          name: 'categories',
          type: 'relationship',
          relationTo: 'categories',
          hasMany: true,
          label: 'Categories (optional)',
          admin: {
            description:
              'If empty, this tab will show all products. If set, it will show products in the selected categories.',
          },
        },
        {
          name: 'limit',
          type: 'number',
          label: 'Max products to show (up to 8)',
          defaultValue: 8,
          min: 1,
          max: 8,
          admin: {
            step: 1,
          },
        },
      ],
    },
  ],
}

