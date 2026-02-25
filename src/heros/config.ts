import type { Field } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { link } from '@/fields/link'
import { linkGroup } from '@/fields/linkGroup'

export const hero: Field = {
  name: 'hero',
  type: 'group',
  fields: [
    {
      name: 'type',
      type: 'select',
      defaultValue: 'lowImpact',
      label: 'Type',
      options: [
        {
          label: 'None',
          value: 'none',
        },
        {
          label: 'High Impact',
          value: 'highImpact',
        },
        {
          label: 'Medium Impact',
          value: 'mediumImpact',
        },
        {
          label: 'Low Impact',
          value: 'lowImpact',
        },
        {
          label: 'Home Slider (Lukani)',
          value: 'homeSlider',
        },
      ],
      required: true,
    },
    {
      name: 'slides',
      type: 'array',
      admin: {
        condition: (_, { type } = {}) => type === 'homeSlider',
      },
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
          name: 'description',
          type: 'textarea',
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
      label: 'Slides',
    },
    {
      name: 'richText',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [
            ...rootFeatures,
            HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
            FixedToolbarFeature(),
            InlineToolbarFeature(),
          ]
        },
      }),
      label: false,
    },
    {
      name: 'secondaryMedia',
      type: 'array',
      admin: {
        condition: (_, { type } = {}) => type === 'mediumImpact',
      },
      fields: [
        {
          name: 'media',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
      label: 'Secondary Media (Collage)',
      maxRows: 3,
    },
    {
      name: 'newestFlowers',
      type: 'array',
      admin: {
        condition: (_, { type } = {}) => type === 'mediumImpact',
      },
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          required: true,
        },
        {
          name: 'label',
          type: 'text',
          defaultValue: 'New Arrival',
        },
      ],
      label: 'Newest Flowers (Card Stack)',
      maxRows: 5,
    },
    {
      name: 'brandInfo',
      type: 'group',
      admin: {
        condition: (_, { type } = {}) => type === 'mediumImpact',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          defaultValue: 'Planto',
        },
        {
          name: 'rating',
          type: 'number',
          defaultValue: 4.8,
          max: 5,
          min: 1,
        },
      ],
      label: 'Brand Info',
    },
    {
      name: 'featuredProduct',
      type: 'group',
      admin: {
        condition: (_, { type } = {}) => type === 'mediumImpact',
      },
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
        },
        {
          name: 'stats',
          type: 'array',
          fields: [
            {
              name: 'label',
              type: 'text',
            },
            {
              name: 'value',
              type: 'text',
            },
          ],
        },
      ],
      label: 'Featured Product Spotlight',
    },
    {
      name: 'trustBadge',
      type: 'group',
      admin: {
        condition: (_, { type } = {}) => type === 'mediumImpact',
      },
      fields: [
        {
          name: 'text',
          type: 'text',
          defaultValue: 'Trusted by 300+ People',
        },
        {
          name: 'avatars',
          type: 'array',
          fields: [
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
            },
          ],
        },
      ],
      label: 'Trust Badge',
    },
    linkGroup({
      overrides: {
        maxRows: 2,
      },
    }),
    {
      name: 'media',
      type: 'upload',
      admin: {
        condition: (_, { type } = {}) => ['highImpact', 'mediumImpact'].includes(type),
      },
      relationTo: 'media',
      required: true,
    },
  ],
  label: false,
}
