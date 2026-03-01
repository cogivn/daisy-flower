'use client'

import { useWishlistContext } from '@/providers/Wishlist'

export const useWishlist = () => {
  return useWishlistContext()
}
