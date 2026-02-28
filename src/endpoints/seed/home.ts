import type { RequiredDataFromCollectionSlug } from 'payload'
import type { SeedContext } from './helpers'
import { rt } from './helpers'

interface HomePageArgs {
  ctx: SeedContext
}

export const homePageData = ({ ctx }: HomePageArgs): RequiredDataFromCollectionSlug<'pages'> => {
  const heroImages = [ctx.media.hero1, ctx.media.hero2, ctx.media.hero3].filter(Boolean)
  const metaImage = ctx.media.hat
  const categoryIds = ['bouquets', 'indoor-plants', 'outdoor-plants', 'dried-flowers']
    .map((slug) => ctx.categories[slug]?.id)
    .filter(Boolean)
  const featuredProductId = ctx.products['aurora-rose-bouquet']?.id
  const newsletterFormId = ctx.forms.newsletter?.id
  const blogImages = ['blog12', 'blog13', 'blog14', 'blog15'].map((k) => ctx.media[k]).filter(Boolean)

  const heroSlides = [
    {
      featured: 'New Plant Arrivals',
      title: 'Lovely Plants & Flowers',
      description: 'Discount 20% off for Lukani members. Beautiful plants and flower arrangements for every space.',
      buttonLabel: 'Shop Now',
      buttonUrl: '/shop',
    },
    {
      featured: 'Limited Time Offer',
      title: 'Fresh Greenery For Your Home',
      description: 'Bring nature indoors with lush plants, curated pots, and accessories for every corner.',
      buttonLabel: 'View Deals',
      buttonUrl: '/shop?tag=sale',
    },
    {
      featured: 'Best Seller Collection',
      title: 'Top Picks For Plant Lovers',
      description: 'Explore our most-loved plants and bouquets, handpicked by the Lukani design team.',
      buttonLabel: 'Browse Collection',
      buttonUrl: '/shop?tag=best-sellers',
    },
  ]

  const blogItems = [
    { kicker: 'Care tips', title: 'How to keep indoor plants thriving all year', excerpt: 'Light, water, and a little routine go a long way. Learn how we care for the plants in our own studio.', url: '/blog/indoor-plant-care' },
    { kicker: 'Occasions', title: 'Picking the perfect bouquet for every moment', excerpt: 'From birthdays to quiet thank-yous, we break down which stems work best for each occasion.', url: '/blog/bouquet-occasion-guide' },
    { kicker: 'Behind the scenes', title: 'A morning inside our flower shop', excerpt: 'Follow our team from first delivery to the last ribbon tie of the day.', url: '/blog/inside-the-flower-shop' },
    { kicker: 'Design notes', title: 'Why we love mixing dried and fresh stems', excerpt: 'Texture, longevity, and unexpected color—see how dried florals can elevate everyday arrangements.', url: '/blog/dried-and-fresh' },
    { kicker: 'Workspace ideas', title: 'Styling your desk with small plants', excerpt: 'A few low-maintenance plants and the right pots can completely change how your desk feels.', url: '/blog/desk-plant-styling' },
    { kicker: 'Gifting', title: 'How to write a heartfelt message for any bouquet', excerpt: 'Not sure what to say on the card? Here are a few prompts our florists use every day.', url: '/blog/bouquet-card-messages' },
  ]

  return {
    slug: 'home',
    _status: 'published',
    title: 'Home',
    hero: {
      type: 'highImpact',
      media: heroImages.map((img, i) => {
        const s = heroSlides[i] || heroSlides[0]
        return {
          image: img as any,
          featured: s.featured,
          title: s.title,
          description: s.description,
          button: [
            { link: { type: 'custom', appearance: 'default', label: s.buttonLabel, url: s.buttonUrl } },
          ],
        }
      }),
      links: [
        { link: { type: 'custom', appearance: 'default', label: 'Shop Now', url: '/shop' } },
        { link: { type: 'custom', appearance: 'outline', label: 'View Deals', url: '/shop?tag=sale' } },
      ],
      richText: rt.root([
        rt.heading('Lovely Plants & Flowers'),
        rt.paragraph('Discount 20% off for Lukani members. Beautiful plants and flower arrangements for every space.'),
      ]),
    },
    layout: [
      {
        blockName: 'Service Features',
        blockType: 'serviceFeatures' as const,
        features: [
          { icon: 'truck' as const, title: 'Free delivery', description: 'On orders over a certain amount. Fast and reliable shipping.' },
          { icon: 'shield' as const, title: 'Quality guarantee', description: 'Fresh flowers and healthy plants, or we make it right.' },
          { icon: 'headphones' as const, title: 'Customer support', description: 'Our team is here to help with orders and care advice.' },
          { icon: 'gift' as const, title: 'Gift wrapping', description: 'Beautiful packaging and cards for every occasion.' },
        ],
      },
      {
        blockName: 'Promo Banners',
        blockType: 'promoBanners' as const,
        banners: [
          { subtitle: 'New arrivals', title: 'Bouquets & fresh flowers', media: heroImages[0], link: { type: 'custom' as const, newTab: false, url: '/shop?category=bouquets', label: 'Shop bouquets' } },
          { subtitle: 'Limited time', title: 'Indoor plants sale', media: heroImages[1], link: { type: 'custom' as const, newTab: false, url: '/shop?tag=sale', label: 'View deals' } },
          { subtitle: 'Best sellers', title: 'Top picks for plant lovers', media: heroImages[2], link: { type: 'custom' as const, newTab: false, url: '/shop?tag=best-sellers', label: 'Browse collection' } },
        ],
      },
      ...(categoryIds.length > 0
        ? [{
            blockName: 'Shop By Categories',
            blockType: 'shopByCategories' as const,
            title: 'Shop By Categories',
            description: 'Find the perfect plants and flowers tailored to your style. We offer solutions designed to meet the needs of every plant lover.',
            exploreMoreLink: { type: 'custom' as const, newTab: false, label: 'Explore More', url: '/shop' },
            categories: categoryIds,
          }]
        : []),
      {
        blockName: 'Limited Time Offer',
        blockType: 'saleOffer',
        sectionTitle: 'Limited Time Offer',
        sectionDescription: "Don't miss out on our best deals. Grab your favourite items before they're gone.",
        highlight: "BEST DEAL, LIMITED TIME OFFER GET YOUR'S NOW!",
        ...(featuredProductId ? { product: featuredProductId } : {}),
      },
      {
        blockName: 'Homepage Product Listing',
        blockType: 'productListing' as const,
        heading: 'Featured Products',
        sectionDescription: 'Discover our favorite bouquets and plants, hand-picked to inspire your next gift or corner refresh.',
        enableSearch: true,
        tabs: ['bouquets', 'indoor-plants', 'outdoor-plants', 'dried-flowers'].map((slug) => ({
          label: ctx.categories[slug]?.title || slug,
          categories: ctx.categories[slug] ? [ctx.categories[slug].id] : [],
          limit: 8,
        })),
      },
      {
        blockName: 'From the Blog',
        blockType: 'blogBento' as const,
        eyebrow: 'From the blog',
        heading: 'Stories from the flower studio',
        description: 'Tips, stories, and behind-the-scenes notes from our florists to help you care for your plants and bouquets.',
        seeMoreLink: { type: 'custom' as const, newTab: false, url: '/blog', label: 'See more' },
        items: blogItems.map((item, i) => ({
          kicker: item.kicker,
          title: item.title,
          excerpt: item.excerpt,
          image: blogImages[i] || heroImages[0],
          link: {
            type: 'custom' as const,
            newTab: false,
            url: item.url,
            label: 'Read story',
            appearance: (i % 2 === 0 ? 'default' : 'outline') as 'default' | 'outline',
          },
        })),
      } as any,
      ...(newsletterFormId
        ? [{
            blockName: 'Newsletter',
            blockType: 'newsletter' as const,
            title: 'Join Our Newsletter',
            description: 'Get updates about our latest bouquets, plants and special offers.',
            form: newsletterFormId,
          }]
        : []),
    ],
    meta: {
      description: 'An open-source ecommerce site built with Payload and Next.js.',
      // @ts-ignore
      image: metaImage,
      title: 'Payload Ecommerce Template',
    },
  }
}
