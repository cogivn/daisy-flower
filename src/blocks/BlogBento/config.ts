import type { Block } from 'payload'

import { link } from '@/fields/link'

export const BlogBento: Block = {
  slug: 'blogBento',
  interfaceName: 'BlogBentoBlock',
  labels: {
    singular: 'Blog bento',
    plural: 'Blog bentos',
  },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      label: 'Eyebrow label',
      admin: {
        description: 'Small label shown above the main heading (e.g. "From the blog").',
      },
    },
    {
      name: 'heading',
      type: 'text',
      required: true,
      label: 'Section heading',
      defaultValue: 'From our blog',
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Section description',
      admin: {
        description: 'Short intro text below the heading.',
      },
    },
    link({
      appearances: false,
      overrides: {
        name: 'seeMoreLink',
        admin: {
          description: 'Optional "See more" button shown in the blog header.',
        },
      },
    }),
    {
      name: 'items',
      type: 'array',
      minRows: 3,
      maxRows: 6,
      labels: {
        singular: 'Blog item',
        plural: 'Blog items',
      },
      admin: {
        description:
          'First item fills the left column, second and third fill the middle, fourth fills the right column.',
      },
      fields: [
        {
          name: 'kicker',
          type: 'text',
          label: 'Kicker',
          admin: {
            description: 'Small label above the item title (e.g. "Mobile friendly").',
          },
        },
        {
          name: 'title',
          type: 'text',
          required: true,
          label: 'Title',
        },
        {
          name: 'excerpt',
          type: 'textarea',
          label: 'Excerpt',
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Image',
          required: true,
        },
        link({
          appearances: ['default', 'outline'],
          overrides: {
            name: 'link',
            label: 'Read more link',
          },
        }),
      ],
    },
  ],
}

