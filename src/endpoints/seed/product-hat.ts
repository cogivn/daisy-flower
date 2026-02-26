import type { Category, Media, Product, VariantType } from '@/payload-types'
import { RequiredDataFromCollectionSlug } from 'payload'

type ProductArgs = {
  galleryImage: Media
  metaImage: Media
  variantTypes: VariantType[]
  categories: Category[]
  relatedProducts: Product[]
}

export const productHatData: (args: ProductArgs) => RequiredDataFromCollectionSlug<'products'> = ({
  galleryImage,
  relatedProducts,
  metaImage,
  variantTypes,
  categories,
}) => {
  return {
    meta: {
      title: 'Aurora Rose Bouquet',
      image: metaImage,
      description:
        'A lush hand‑tied bouquet of premium roses and seasonal greenery, perfect for birthdays, anniversaries, or simply brightening any space.',
    },
    _status: 'published',
    layout: [],
    categories: categories,
    enableVariants: false,
    description: {
      root: {
        children: [
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: 'Aurora Rose Bouquet combines soft pink and ivory roses with airy filler flowers and fresh foliage. Wrapped in eco‑friendly paper and finished with a satin ribbon, it is an elegant choice for gifting or styling your living room.',
                type: 'text',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'paragraph',
            version: 1,
            textFormat: 0,
            textStyle: '',
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    },
    gallery: [{ image: galleryImage }],
    title: 'Aurora Rose Bouquet',
    slug: 'aurora-rose-bouquet',
    priceInUSDEnabled: true,
    priceInUSD: 4999,
    relatedProducts: relatedProducts,
  }
}
