import type { MediaEntry } from '../helpers'

const LUKANI = 'https://template.hasthemes.com/lukani/lukani/assets/img'
const PAYLOAD_TPL =
  'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/ecommerce/src/endpoints/seed'

export const heroMedia: MediaEntry[] = [
  { key: 'hero1', url: `${LUKANI}/slider/slider1.jpg`, alt: 'Hero slide 1' },
  { key: 'hero2', url: `${LUKANI}/slider/slider2.jpg`, alt: 'Hero slide 2' },
  { key: 'hero3', url: `${LUKANI}/slider/slider3.jpg`, alt: 'Hero slide 3' },
]

export const productMedia: MediaEntry[] = Array.from({ length: 12 }, (_, i) => ({
  key: `product${i + 1}`,
  url: `${LUKANI}/product/product${i + 1}.jpg`,
  alt: `Product image ${i + 1}`,
}))

export const bannerMedia: MediaEntry[] = Array.from({ length: 6 }, (_, i) => ({
  key: `banner${i + 1}`,
  url: `${LUKANI}/bg/banner${i + 1}.jpg`,
  alt: `Category banner ${i + 1}`,
}))

export const blogMedia: MediaEntry[] = [12, 13, 14, 15].map((n) => ({
  key: `blog${n}`,
  url: `${LUKANI}/blog/blog${n}.jpg`,
  alt: `Blog image ${n}`,
}))

export const legacyMedia: MediaEntry[] = [
  { key: 'hat', url: `${PAYLOAD_TPL}/hat-logo.png`, alt: 'Aurora Rose Bouquet' },
  { key: 'tshirtBlack', url: `${PAYLOAD_TPL}/tshirt-black.png`, alt: 'Evergreen Desk Plant - Dark' },
  { key: 'tshirtWhite', url: `${PAYLOAD_TPL}/tshirt-white.png`, alt: 'Evergreen Desk Plant - Light' },
]
