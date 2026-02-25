import type { Field } from 'payload'

import {
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { linkGroup } from './linkGroup'
import { link } from './link'

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
      ],
      required: true,
    },
    {
      name: 'featuredText',
      type: 'text',
      admin: {
        condition: (_, { type } = {}) => type === 'mediumImpact',
      },
      label: 'Featured Badge/Label',
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
      admin: {
        condition: (_, { type } = {}) => ['mediumImpact', 'lowImpact'].includes(type),
      },
      label: false,
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
      name: 'mediaCarousel',
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
      label: 'Main Media Carousel (MD3 Style)',
      maxRows: 3,
      minRows: 1,
    },
    linkGroup({
      overrides: {
        maxRows: 2,
      },
    }),
    {
      name: 'media',
      type: 'array',
      admin: {
        condition: (_, { type } = {}) => type === 'highImpact',
      },
      minRows: 1,
      maxRows: 5,
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'featured',
          type: 'text',
          label: 'Featured label',
        },
        {
          name: 'title',
          type: 'text',
          label: 'Title',
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Description',
        },
        {
          name: 'button',
          type: 'array',
          label: 'Button (optional)',
          minRows: 0,
          maxRows: 1,
          fields: [
            link({
              appearances: ['default', 'outline'],
            }),
          ],
        },
      ],
    },
  ],
  label: false,
}
