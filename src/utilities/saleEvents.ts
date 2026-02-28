import type { Product, SaleEvent } from '@/payload-types'

/**
 * Get the active sale event for a product
 */
export function getActiveSaleEvent(product: Partial<Product>): SaleEvent | null {
  if (!product.saleEvents?.docs?.length) {
    return null
  }

  const now = new Date()

  // Find the first active sale event
  const activeSale = product.saleEvents.docs.find((saleEventDoc) => {
    if (typeof saleEventDoc === 'number') return false
    
    const saleEvent = saleEventDoc as SaleEvent
    
    // Check if status is explicitly set to active
    if (saleEvent.status === 'active') {
      return true
    }
    
    // Check if status is not explicitly expired and dates are valid
    if (saleEvent.status === 'expired') {
      return false
    }
    
    // Check date range if status is scheduled or null
    const startsAt = new Date(saleEvent.startsAt)
    const endsAt = new Date(saleEvent.endsAt)
    
    return now >= startsAt && now <= endsAt
  })

  return activeSale && typeof activeSale !== 'number' ? activeSale : null
}

/**
 * Calculate discount percentage
 */
export function calculateDiscountPercentage(originalPrice: number, salePrice: number): number {
  if (originalPrice <= 0 || salePrice >= originalPrice) return 0
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100)
}

/**
 * Get the effective price for a product (sale price if on sale, otherwise regular price)
 */
export function getEffectivePrice(product: Partial<Product>): {
  price: number
  originalPrice?: number
  saleEvent?: SaleEvent
  isOnSale: boolean
} {
  let basePrice = product.priceInUSD

  // Handle variants
  const variants = product.variants?.docs
  if (variants && variants.length > 0) {
    const variant = variants[0]
    if (
      variant &&
      typeof variant === 'object' &&
      variant?.priceInUSD &&
      typeof variant.priceInUSD === 'number'
    ) {
      basePrice = variant.priceInUSD
    }
  }

  if (typeof basePrice !== 'number') {
    return { price: 0, isOnSale: false }
  }

  const activeSale = getActiveSaleEvent(product)
  
  if (activeSale) {
    return {
      price: activeSale.salePrice,
      originalPrice: basePrice,
      saleEvent: activeSale,
      isOnSale: true,
    }
  }

  return {
    price: basePrice,
    isOnSale: false,
  }
}