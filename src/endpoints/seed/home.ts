import type { Category, Media } from '@/payload-types'
import { RequiredDataFromCollectionSlug } from 'payload'

type ProductArgs = {
  metaImage: Media
  heroImages: Media[]
  categories?: Category[]
}

export const homePageData: (args: ProductArgs) => RequiredDataFromCollectionSlug<'pages'> = ({
  metaImage,
  heroImages,
  categories = [],
}) => {
  const [primaryHeroImage] = heroImages

  const heroSlidesMeta = [
    {
      featured: 'New Plant Arrivals',
      title: 'Lovely Plants & Flowers',
      description:
        'Discount 20% off for Lukani members. Beautiful plants and flower arrangements for every space.',
      button: {
        label: 'Shop Now',
        url: '/shop',
      },
    },
    {
      featured: 'Limited Time Offer',
      title: 'Fresh Greenery For Your Home',
      description:
        'Bring nature indoors with lush plants, curated pots, and accessories for every corner.',
      button: {
        label: 'View Deals',
        url: '/shop?tag=sale',
      },
    },
    {
      featured: 'Best Seller Collection',
      title: 'Top Picks For Plant Lovers',
      description:
        'Explore our most-loved plants and bouquets, handpicked by the Lukani design team.',
      button: {
        label: 'Browse Collection',
        url: '/shop?tag=best-sellers',
      },
    },
  ]

  return {
    slug: 'home',
    _status: 'published',
    hero: {
      type: 'highImpact',
      media: heroImages.map((image, index) => {
        const meta = heroSlidesMeta[index] || heroSlidesMeta[0]

        return {
          image,
          featured: meta.featured,
          title: meta.title,
          description: meta.description,
          button: [
            {
              link: {
                type: 'custom',
                appearance: 'default',
                label: meta.button.label,
                url: meta.button.url,
              },
            },
          ],
        }
      }),
      links: [
        {
          link: {
            type: 'custom',
            appearance: 'default',
            label: 'Shop Now',
            url: '/shop',
          },
        },
        {
          link: {
            type: 'custom',
            appearance: 'outline',
            label: 'View Deals',
            url: '/shop?tag=sale',
          },
        },
      ],
      richText: {
        root: {
          type: 'root',
          children: [
            {
              type: 'heading',
              children: [
                {
                  type: 'text',
                  detail: 0,
                  format: 0,
                  mode: 'normal',
                  style: '',
                  text: 'Lovely Plants & Flowers',
                  version: 1,
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              tag: 'h1',
              version: 1,
            },
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  detail: 0,
                  format: 0,
                  mode: 'normal',
                  style: '',
                  text: 'Discount 20% off for Lukani members. Beautiful plants and flower arrangements for every space.',
                  version: 1,
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              textFormat: 0,
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
        },
      },
    },
    layout: [
      {
        blockName: 'Shipping Features',
        blockType: 'serviceFeatures',
        features: [
          {
            icon: 'truck',
            title: 'Free Delivery',
            description: 'Free shipping around the world for all orders over $120',
          },
          {
            icon: 'shield',
            title: 'Safe Payment',
            description: "With our payment gateway, don’t worry about your information",
          },
          {
            icon: 'headphones',
            title: 'Friendly Services',
            description: 'You have 30-day return guarantee for every single order',
          },
        ],
      },
      ...(categories.length > 0
        ? [
            {
              blockName: 'Shop By Categories',
              blockType: 'shopByCategories' as const,
              title: 'Shop By Categories',
              description:
                'Find the perfect plants and flowers tailored to your style. We offer solutions designed to meet the needs of every plant lover.',
              exploreMoreLink: {
                type: 'custom' as const,
                newTab: false,
                label: 'Explore More',
                url: '/shop',
              },
              categories: categories.map((c) => c.id),
            },
          ]
        : []),
      {
        blockName: 'Limited Time Offer',
        blockType: 'saleOffer',
        sectionTitle: 'Limited Time Offer',
        sectionDescription:
          'Don’t miss out on our best deals. Grab your favourite items before they’re gone.',
        productLabel: 'Backpack',
        gallery: heroImages.slice(0, 3).map((image) => ({ image })),
        title: 'BLINGO BACKPACK',
        description:
          'Neque porro quisquam est, qui dolorem ipsum quia dolor ipisci velit, sed quia non numquam eius modi.',
        originalPrice: 199,
        price: 162,
        currency: '$',
        rating: 5,
        highlight: "BEST DEAL, LIMITED TIME OFFER GET YOUR'S NOW!",
        countdown: {
          enabled: true,
          // Future date so sale stays active: original price strikethrough + green sale price + countdown
          targetDate: '2026-12-31T23:59:59.000Z',
        },
        cta: [
          {
            link: {
              type: 'custom' as const,
              newTab: false,
              label: 'Shop Now',
              url: '/shop',
            },
          },
        ],
      },
      {
        blockName: 'Content Block',
        blockType: 'content',
        columns: [
          {
            richText: {
              root: {
                type: 'root',
                children: [
                  {
                    type: 'heading',
                    children: [
                      {
                        type: 'text',
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: 'Core features',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    tag: 'h2',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                version: 1,
              },
            },
            size: 'full',
          },
          {
            enableLink: false,
            richText: {
              root: {
                type: 'root',
                children: [
                  {
                    type: 'heading',
                    children: [
                      {
                        type: 'text',
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: 'Admin Dashboard',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    tag: 'h3',
                    version: 1,
                  },
                  {
                    type: 'paragraph',
                    children: [
                      {
                        type: 'text',
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: "Manage this site's pages and products from the ",
                        version: 1,
                      },
                      {
                        type: 'link',
                        children: [
                          {
                            type: 'text',
                            detail: 0,
                            format: 0,
                            mode: 'normal',
                            style: '',
                            text: 'admin dashboard',
                            version: 1,
                          },
                        ],
                        direction: 'ltr',
                        fields: {
                          linkType: 'custom',
                          newTab: false,
                          url: '/admin',
                        },
                        format: '',
                        indent: 0,
                        version: 2,
                      },
                      {
                        type: 'text',
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: '.',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    textFormat: 0,
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                version: 1,
              },
            },
            size: 'oneThird',
          },
          {
            enableLink: false,
            richText: {
              root: {
                type: 'root',
                children: [
                  {
                    type: 'heading',
                    children: [
                      {
                        type: 'text',
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: 'Preview',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    tag: 'h3',
                    version: 1,
                  },
                  {
                    type: 'paragraph',
                    children: [
                      {
                        type: 'text',
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: 'Using versions, drafts, and preview, editors can review and share their changes before publishing them.',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    textFormat: 0,
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                version: 1,
              },
            },
            size: 'oneThird',
          },
          {
            enableLink: false,
            richText: {
              root: {
                type: 'root',
                children: [
                  {
                    type: 'heading',
                    children: [
                      {
                        type: 'text',
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: 'Page Builder',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    tag: 'h3',
                    version: 1,
                  },
                  {
                    type: 'paragraph',
                    children: [
                      {
                        type: 'text',
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: 'Custom page builder allows you to create unique page and product layouts for any type of content.',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    textFormat: 0,
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                version: 1,
              },
            },
            size: 'oneThird',
          },
          {
            enableLink: false,
            richText: {
              root: {
                type: 'root',
                children: [
                  {
                    type: 'heading',
                    children: [
                      {
                        type: 'text',
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: 'SEO',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    tag: 'h3',
                    version: 1,
                  },
                  {
                    type: 'paragraph',
                    children: [
                      {
                        type: 'text',
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: 'Editors have complete control over SEO data and site content directly from the ',
                        version: 1,
                      },
                      {
                        type: 'link',
                        children: [
                          {
                            type: 'text',
                            detail: 0,
                            format: 0,
                            mode: 'normal',
                            style: '',
                            text: 'admin dashboard',
                            version: 1,
                          },
                        ],
                        direction: 'ltr',
                        fields: {
                          linkType: 'custom',
                          newTab: false,
                          url: '/admin',
                        },
                        format: '',
                        indent: 0,
                        version: 2,
                      },
                      {
                        type: 'text',
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: '.',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    textFormat: 0,
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                version: 1,
              },
            },
            size: 'oneThird',
          },
          {
            enableLink: false,
            richText: {
              root: {
                type: 'root',
                children: [
                  {
                    type: 'heading',
                    children: [
                      {
                        type: 'text',
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: 'Dark Mode',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    tag: 'h3',
                    version: 1,
                  },
                  {
                    type: 'paragraph',
                    children: [
                      {
                        type: 'text',
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: 'Users will experience this site in their preferred color scheme and each block can be inverted.',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    textFormat: 0,
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                version: 1,
              },
            },
            size: 'oneThird',
          },
        ],
      },
      {
        blockName: 'Media Block',
        blockType: 'mediaBlock',
        media: primaryHeroImage,
      },
      {
        blockName: 'CTA',
        blockType: 'cta',
        links: [
          {
            link: {
              type: 'custom',
              appearance: 'default',
              label: 'All products',
              url: '/products',
            },
          },
        ],
        richText: {
          root: {
            type: 'root',
            children: [
              {
                type: 'heading',
                children: [
                  {
                    type: 'text',
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'This is a call to action',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                tag: 'h3',
                version: 1,
              },
              {
                type: 'paragraph',
                children: [
                  {
                    type: 'text',
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'This is a custom layout building block ',
                    version: 1,
                  },
                  {
                    type: 'link',
                    children: [
                      {
                        type: 'text',
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: 'configured in the admin dashboard',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    fields: {
                      linkType: 'custom',
                      newTab: false,
                      url: '/admin',
                    },
                    format: '',
                    indent: 0,
                    version: 2,
                  },
                  {
                    type: 'text',
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: '.',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                textFormat: 0,
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            version: 1,
          },
        },
      },
    ],
    meta: {
      description: 'An open-source ecommerce site built with Payload and Next.js.',
      // @ts-ignore
      image: metaImage,
      title: 'Payload Ecommerce Template',
    },
    title: 'Home',
  }
}
