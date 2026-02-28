import type { Block } from 'payload'

export const Newsletter: Block = {
  slug: 'newsletter',
  labels: {
    singular: 'Newsletter',
    plural: 'Newsletter Blocks',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      defaultValue: 'Join Our Newsletter',
    },
    {
      name: 'description',
      type: 'text',
      admin: {
        description: 'Short text shown next to the signup form.',
      },
    },
    {
      name: 'form',
      type: 'relationship',
      relationTo: 'forms',
      required: true,
      admin: {
        description: 'Form must include an email field. Create a form in Content → Forms if needed.',
      },
    },
  ],
  interfaceName: 'NewsletterBlock',
}
