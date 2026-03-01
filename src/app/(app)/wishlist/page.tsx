'use client'

import { Grid } from '@/components/Grid'
import { ProductCard } from '@/components/product/ProductCard'
import { Button } from '@/components/ui/button'
import { useWishlist } from '@/hooks/useWishlist'
import { Product } from '@/payload-types'
import { Heart } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function WishlistPage() {
  const { wishlistIds, isLoading } = useWishlist()
  const [products, setProducts] = useState<Product[]>([])
  const [isFetchingProducts, setIsFetchingProducts] = useState(false)

  const fetchWishlistProducts = async (ids: string[]) => {
    if (ids.length === 0) {
      setProducts([])
      return
    }

    setIsFetchingProducts(true)
    try {
      const uniqueIdsStr = ids.join(',')

      // Use standard Payload 'in' syntax: where[id][in]=id1,id2,id3
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/products?where[id][in]=${uniqueIdsStr}&depth=2&limit=100`,
        { next: { revalidate: 0 } },
      )
      const data = await res.json()
      if (data.docs) {
        // Efficient Map-based sort: O(M log M + W) instead of O(M log M * W)
        const idToIndex = new Map(ids.map((id, index) => [String(id), index]))
        const sorted = (data.docs as Product[]).sort((a, b) => {
          const indexA = idToIndex.get(String(a.id)) ?? 999
          const indexB = idToIndex.get(String(b.id)) ?? 999
          return indexA - indexB
        })
        setProducts(sorted)
      }
    } catch (error) {
      console.error('Error fetching wishlist products:', error)
    } finally {
      setIsFetchingProducts(false)
    }
  }

  // Handle local removal instantly & fetching new products
  useEffect(() => {
    if (!isLoading) {
      const uniqueWishlistIds = Array.from(new Set(wishlistIds))

      // 1. Instant local removal check
      const currentFilteredProducts = products.filter((p) =>
        uniqueWishlistIds.includes(String(p.id)),
      )
      if (currentFilteredProducts.length !== products.length) {
        setProducts(currentFilteredProducts)
      }

      // 2. Fetch missing products
      const loadedIds = products.map((p) => String(p.id))
      const missingIds = uniqueWishlistIds.filter((id) => !loadedIds.includes(id))

      if (missingIds.length > 0 || (uniqueWishlistIds.length > 0 && products.length === 0)) {
        // If we have missing items, it's safer to fetch the whole list to maintain order or just the missing ones
        // Fetching whole list ensures order and consistency
        fetchWishlistProducts(uniqueWishlistIds)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wishlistIds, isLoading])

  if (isLoading && products.length === 0) {
    return (
      <div className="container py-20 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container py-10 md:py-20">
      <div className="flex flex-col items-center mb-12">
        <Heart className="h-12 w-12 text-primary mb-4 fill-primary" />
        <h1 className="text-4xl font-bold tracking-tight">Your Wishlist</h1>
        <p className="text-muted-foreground mt-2">
          {wishlistIds.length === 0
            ? "You haven't added any products to your wishlist yet."
            : `You have ${wishlistIds.length} item${wishlistIds.length > 1 ? 's' : ''} in your wishlist.`}
        </p>
      </div>

      {wishlistIds.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg bg-muted/30">
          <p className="text-lg font-medium text-muted-foreground mb-6">
            Explore our collection and find something you love!
          </p>
          <Button asChild>
            <Link href="/shop">Start Shopping</Link>
          </Button>
        </div>
      ) : (
        <Grid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          {isFetchingProducts && products.length < wishlistIds.length && (
            <div className="col-span-full flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
        </Grid>
      )}
    </div>
  )
}
