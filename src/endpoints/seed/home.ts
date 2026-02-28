import type { Category, Media, Product } from '@/payload-types'
import { RequiredDataFromCollectionSlug } from 'payload'

type ProductArgs = {
  metaImage: Media
  heroImages: Media[]
  categories?: Category[]
  product?: Product | number | string | null
  blogImages?: Media[]
  newsletterForm?: { id: number }
}

export const homePageData = ({
  metaImage,
  heroImages,
  categories = [],
  product,
  blogImages = [],
  newsletterForm,
}: ProductArgs): RequiredDataFromCollectionSlug<'pages'> => {
  const [primaryHeroImage, secondaryHeroImage, tertiaryHeroImage] = heroImages

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
        blockName: 'Service Features',
        blockType: 'serviceFeatures' as const,
        features: [
          {
            icon: 'truck' as const,
            title: 'Free delivery',
            description: 'On orders over a certain amount. Fast and reliable shipping.',
          },
          {
            icon: 'shield' as const,
            title: 'Quality guarantee',
            description: 'Fresh flowers and healthy plants, or we make it right.',
          },
          {
            icon: 'headphones' as const,
            title: 'Customer support',
            description: 'Our team is here to help with orders and care advice.',
          },
          {
            icon: 'gift' as const,
            title: 'Gift wrapping',
            description: 'Beautiful packaging and cards for every occasion.',
          },
        ],
      },
      {
        blockName: 'Promo Banners',
        blockType: 'promoBanners' as const,
        banners: [
          {
            subtitle: 'New arrivals',
            title: 'Bouquets & fresh flowers',
            media: primaryHeroImage,
            link: {
              type: 'custom' as const,
              newTab: false,
              url: '/shop?category=bouquets',
              label: 'Shop bouquets',
            },
          },
          {
            subtitle: 'Limited time',
            title: 'Indoor plants sale',
            media: secondaryHeroImage,
            link: {
              type: 'custom' as const,
              newTab: false,
              url: '/shop?tag=sale',
              label: 'View deals',
            },
          },
          {
            subtitle: 'Best sellers',
            title: 'Top picks for plant lovers',
            media: tertiaryHeroImage,
            link: {
              type: 'custom' as const,
              newTab: false,
              url: '/shop?tag=best-sellers',
              label: 'Browse collection',
            },
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
        highlight: "BEST DEAL, LIMITED TIME OFFER GET YOUR'S NOW!",
        // Link the featured product into the sale offer if provided
        ...(product
          ? {
              product: (typeof product === 'object' && product !== null
                ? (product as Product).id
                : product) as number | Product | null,
            }
          : {}),
      },
      {
        blockName: 'Homepage Product Listing',
        blockType: 'productListing' as const,
        heading: 'Featured Products',
        sectionDescription:
          'Discover our favorite bouquets and plants, hand-picked to inspire your next gift or corner refresh.',
        enableSearch: true,
        tabs: [
          {
            label: 'Bouquets',
            categories: categories
              .filter((c) => c.slug === 'bouquets' || c.title === 'Bouquets')
              .map((c) => c.id),
            limit: 8,
          },
          {
            label: 'Indoor Plants',
            categories: categories
              .filter((c) => c.slug === 'indoor-plants' || c.title === 'Indoor Plants')
              .map((c) => c.id),
            limit: 8,
          },
          {
            label: 'Outdoor Plants',
            categories: categories
              .filter((c) => c.slug === 'outdoor-plants' || c.title === 'Outdoor Plants')
              .map((c) => c.id),
            limit: 8,
          },
          {
            label: 'Dried Flowers',
            categories: categories
              .filter((c) => c.slug === 'dried-flowers' || c.title === 'Dried Flowers')
              .map((c) => c.id),
            limit: 8,
          },
        ],
      },
      {
        blockName: 'From the Blog',
        blockType: 'blogBento' as const,
        eyebrow: 'From the blog',
        heading: 'Stories from the flower studio',
        description:
          'Tips, stories, and behind-the-scenes notes from our florists to help you care for your plants and bouquets.',
        seeMoreLink: {
          type: 'custom' as const,
          newTab: false,
          url: '/blog',
          label: 'See more',
        },
        items: [
          {
            kicker: 'Care tips',
            title: 'How to keep indoor plants thriving all year',
            excerpt:
              'Light, water, and a little routine go a long way. Learn how we care for the plants in our own studio.',
            image: blogImages[0] || secondaryHeroImage || primaryHeroImage,
            link: {
              type: 'custom' as const,
              newTab: false,
              url: '/blog/indoor-plant-care',
              label: 'Read story',
              appearance: 'default' as const,
            },
          },
          {
            kicker: 'Occasions',
            title: 'Picking the perfect bouquet for every moment',
            excerpt:
              'From birthdays to quiet thank-yous, we break down which stems work best for each occasion.',
            image: blogImages[1] || tertiaryHeroImage || primaryHeroImage,
            link: {
              type: 'custom' as const,
              newTab: false,
              url: '/blog/bouquet-occasion-guide',
              label: 'Read story',
              appearance: 'outline' as const,
            },
          },
          {
            kicker: 'Behind the scenes',
            title: 'A morning inside our flower shop',
            excerpt:
              'Follow our team from first delivery to the last ribbon tie of the day.',
            image: blogImages[2] || primaryHeroImage,
            link: {
              type: 'custom' as const,
              newTab: false,
              url: '/blog/inside-the-flower-shop',
              label: 'Read story',
              appearance: 'default' as const,
            },
          },
          {
            kicker: 'Design notes',
            title: 'Why we love mixing dried and fresh stems',
            excerpt:
              'Texture, longevity, and unexpected color—see how dried florals can elevate everyday arrangements.',
            image: blogImages[3] || tertiaryHeroImage || secondaryHeroImage || primaryHeroImage,
            link: {
              type: 'custom' as const,
              newTab: false,
              url: '/blog/dried-and-fresh',
              label: 'Read story',
              appearance: 'outline' as const,
            },
          },
          {
            kicker: 'Workspace ideas',
            title: 'Styling your desk with small plants',
            excerpt:
              'A few low-maintenance plants and the right pots can completely change how your desk feels.',
            image: blogImages[4] || secondaryHeroImage || primaryHeroImage,
            link: {
              type: 'custom' as const,
              newTab: false,
              url: '/blog/desk-plant-styling',
              label: 'Read story',
              appearance: 'default' as const,
            },
          },
          {
            kicker: 'Gifting',
            title: 'How to write a heartfelt message for any bouquet',
            excerpt:
              'Not sure what to say on the card? Here are a few prompts our florists use every day.',
            image: blogImages[5] || tertiaryHeroImage || primaryHeroImage,
            link: {
              type: 'custom' as const,
              newTab: false,
              url: '/blog/bouquet-card-messages',
              label: 'Read story',
              appearance: 'outline' as const,
            },
          },
        ],
      } as any,
      ...(newsletterForm
        ? [
            {
              blockName: 'Newsletter',
              blockType: 'newsletter' as const,
              title: 'Join Our Newsletter',
              description:
                'Get updates about our latest bouquets, plants and special offers.',
              form: newsletterForm.id,
            },
          ]
        : []),
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
