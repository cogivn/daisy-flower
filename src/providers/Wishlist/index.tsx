'use client'

import type { Wishlist } from '@/payload-types'
import { useAuth } from '@/providers/Auth'
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'

const WISHLIST_LOCAL_STORAGE_KEY = 'daisy_flower_wishlist'

type WishlistContextType = {
  wishlistIds: string[]
  isLoading: boolean
  toggleWishlist: (productId: string | number) => Promise<void>
  isInWishlist: (productId: string | number) => boolean
  fetchWishlist: () => Promise<void>
}

const WishlistContext = createContext<WishlistContextType>({
  wishlistIds: [],
  isLoading: true,
  toggleWishlist: async () => {},
  isInWishlist: () => false,
  fetchWishlist: async () => {},
})

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, status } = useAuth()
  const [wishlistIds, setWishlistIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchWishlist = useCallback(async () => {
    if (user?.id) {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SERVER_URL}/api/wishlist?where[customer][equals]=${user.id}&limit=100`,
          { credentials: 'include' },
        )
        const data = await res.json()
        if (data.docs) {
          const ids = data.docs.map((doc: Wishlist) =>
            typeof doc.product === 'object' ? String(doc.product.id) : String(doc.product),
          )
          setWishlistIds(Array.from(new Set(ids)))
        }
      } catch (error) {
        console.error('Error fetching wishlist:', error)
      }
    } else {
      const localWishlist = localStorage.getItem(WISHLIST_LOCAL_STORAGE_KEY)
      if (localWishlist) {
        try {
          setWishlistIds(JSON.parse(localWishlist) as string[])
        } catch {
          setWishlistIds([])
        }
      } else {
        setWishlistIds([])
      }
    }
    setIsLoading(false)
  }, [user?.id])

  // Initial fetch
  useEffect(() => {
    fetchWishlist()
  }, [fetchWishlist])

  // Sync logic: Move guest items to user account on login
  useEffect(() => {
    const syncWishlist = async () => {
      const localWishlist = localStorage.getItem(WISHLIST_LOCAL_STORAGE_KEY)
      if (user?.id && status === 'loggedIn' && localWishlist) {
        try {
          const guestIds = JSON.parse(localWishlist) as string[]
          if (guestIds.length > 0) {
            const currentWishlistRes = await fetch(
              `${process.env.NEXT_PUBLIC_SERVER_URL}/api/wishlist?where[customer][equals]=${user.id}&limit=100`,
              { credentials: 'include' },
            )
            const currentData = await currentWishlistRes.json()
            const existingProductIds =
              currentData.docs?.map((doc: Wishlist) =>
                typeof doc.product === 'object' ? String(doc.product.id) : String(doc.product),
              ) || []

            const newIdsToSync = guestIds.filter((id) => !existingProductIds.includes(String(id)))

            if (newIdsToSync.length > 0) {
              await Promise.all(
                newIdsToSync.map((productId) =>
                  fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/wishlist`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      customer: user.id,
                      product: Number(productId),
                    }),
                  }),
                ),
              )
              toast.success(`Synced ${newIdsToSync.length} items to your wishlist`)
            }
          }
          localStorage.removeItem(WISHLIST_LOCAL_STORAGE_KEY)
          fetchWishlist()
        } catch (error) {
          console.error('Error syncing wishlist:', error)
        }
      }
    }

    if (status === 'loggedIn') {
      syncWishlist()
    }
  }, [user?.id, status, fetchWishlist])

  const toggleWishlist = async (productId: string | number) => {
    const pIdStr = String(productId)
    const isItemInWishlist = wishlistIds.includes(pIdStr)

    if (user?.id) {
      // Optimistic update
      setWishlistIds((prev) =>
        isItemInWishlist ? prev.filter((id) => id !== pIdStr) : [...prev, pIdStr],
      )

      try {
        if (isItemInWishlist) {
          const searchRes = await fetch(
            `${process.env.NEXT_PUBLIC_SERVER_URL}/api/wishlist?where[customer][equals]=${user.id}&where[product][equals]=${pIdStr}&limit=1`,
            { credentials: 'include' },
          )
          const searchData = await searchRes.json()

          if (searchData.docs?.[0]?.id) {
            const deleteRes = await fetch(
              `${process.env.NEXT_PUBLIC_SERVER_URL}/api/wishlist/${searchData.docs[0].id}`,
              {
                method: 'DELETE',
                credentials: 'include',
              },
            )
            if (deleteRes.ok) {
              toast.success('Removed from wishlist')
            } else {
              await fetchWishlist() // Rollback
              toast.error('Failed to remove from wishlist')
            }
          }
        } else {
          const addRes = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/wishlist`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customer: user.id,
              product: Number(productId), // Payload expects number IDs based on config
            }),
          })
          if (addRes.ok) {
            toast.success('Added to wishlist')
          } else {
            await fetchWishlist() // Rollback
            const errorData = await addRes.json()
            toast.error(errorData?.errors?.[0]?.message || 'Failed to add to wishlist')
          }
        }
      } catch (error) {
        console.error('Wishlist error:', error)
        fetchWishlist() // Rollback
        toast.error('Something went wrong')
      }
    } else {
      // Guest logic
      const next = isItemInWishlist
        ? wishlistIds.filter((id) => id !== pIdStr)
        : Array.from(new Set([...wishlistIds, pIdStr]))

      setWishlistIds(next)
      localStorage.setItem(WISHLIST_LOCAL_STORAGE_KEY, JSON.stringify(next))

      if (isItemInWishlist) {
        toast.success('Removed from wishlist')
      } else {
        toast.success('Added to wishlist')
      }
    }
  }

  // O(1) lookup optimization
  const wishlistIdsSet = React.useMemo(() => new Set(wishlistIds), [wishlistIds])

  const isInWishlist = (productId: string | number) => wishlistIdsSet.has(String(productId))

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        isLoading,
        toggleWishlist,
        isInWishlist,
        fetchWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlistContext = () => useContext(WishlistContext)
