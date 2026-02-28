import type { RequiredDataFromCollectionSlug } from 'payload'
import { rt } from './helpers'

export const contactPageData = (contactFormId: number | string): RequiredDataFromCollectionSlug<'pages'> => (({
  slug: 'contact',
  _status: 'published',
  title: 'Contact',
  hero: { type: 'none' },
  layout: [
    {
      blockType: 'formBlock',
      enableIntro: true,
      form: contactFormId,
      introContent: rt.root([rt.heading('Example contact form:', 'h3')]),
    },
  ],
}) as any)
