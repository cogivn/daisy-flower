import type { Block } from 'payload'

export const ServiceFeatures: Block = {
  slug: 'serviceFeatures',
  fields: [
    {
      name: 'features',
      type: 'array',
      fields: [
        {
          name: 'icon',
          type: 'select',
          options: [
            { label: 'Truck', value: 'truck' },
            { label: 'Shield', value: 'shield' },
            { label: 'Headphones', value: 'headphones' },
            { label: 'Gift', value: 'gift' },
          ],
          defaultValue: 'truck',
        },
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'text',
        },
      ],
      minRows: 1,
      maxRows: 4,
    },
  ],
  interfaceName: 'ServiceFeaturesBlock',
}
