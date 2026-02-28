export interface CategorySeed {
  title: string
  slug: string
  description: string
  bannerKey?: string
}

export const categories: CategorySeed[] = [
  {
    title: 'Bouquets',
    slug: 'bouquets',
    description: 'Hand-tied flower bouquets for birthdays, anniversaries and every occasion.',
    bannerKey: 'banner1',
  },
  {
    title: 'Indoor Plants',
    slug: 'indoor-plants',
    description: 'Low‑maintenance indoor plants to bring fresh greenery into your home.',
    bannerKey: 'banner2',
  },
  {
    title: 'Outdoor Plants',
    slug: 'outdoor-plants',
    description: 'Hardy outdoor plants that thrive on balconies, terraces and in gardens.',
    bannerKey: 'banner3',
  },
  {
    title: 'Dried Flowers',
    slug: 'dried-flowers',
    description: 'Long‑lasting dried and preserved arrangements that stay beautiful for months.',
    bannerKey: 'banner4',
  },
  {
    title: 'Flower Accessories',
    slug: 'flower-accessories',
    description: 'Vases, ribbons, cards and add‑ons to complete your floral gift.',
    bannerKey: 'banner5',
  },
  {
    title: 'Gift Boxes',
    slug: 'gift-boxes',
    description: 'Curated gift boxes with flowers, candles and sweet treats.',
    bannerKey: 'banner6',
  },
  {
    title: 'Wedding Flowers',
    slug: 'wedding-flowers',
    description: 'Bridal bouquets, boutonnieres and ceremony florals for your big day.',
  },
  {
    title: 'Birthday Flowers',
    slug: 'birthday-flowers',
    description: 'Bright and joyful arrangements designed specifically for birthday celebrations.',
  },
  {
    title: 'Sympathy & Condolences',
    slug: 'sympathy-flowers',
    description: 'Soft, respectful arrangements to express sympathy and support.',
  },
  {
    title: 'Office & Corporate',
    slug: 'office-corporate',
    description: 'Weekly office flowers and corporate gifts to keep workspaces fresh.',
  },
]
