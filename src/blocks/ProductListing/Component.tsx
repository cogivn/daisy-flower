import type { Product, ProductListingBlock as ProductListingBlockProps } from '@/payload-types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { ProductListingClient } from './Component.client'

type Props = ProductListingBlockProps

export const ProductListingBlock: React.FC<Props> = async (props) => {
  const { sectionDescription, heading, enableSearch, tabs } = props

  const payload = await getPayload({ config: configPromise })

  const adminTabs = Array.isArray(tabs) ? tabs : []

  // Always inject an implicit \"All\" tab as the first tab.
  // Admin can configure additional tabs (Bouquets, Indoor Plants, etc.)
  const tabsToUse = [
    {
      id: 'all',
      label: 'All',
      categories: null,
      limit: 8,
    },
    ...adminTabs,
  ]

  const tabsWithProducts = await Promise.all(
    tabsToUse.map(async (tab, index) => {
      const rawLimit = typeof tab.limit === 'number' && tab.limit > 0 ? tab.limit : 8
      const limit = Math.min(8, rawLimit)

      const flattenedCategories = tab.categories?.length
        ? tab.categories.map((category) => {
            if (typeof category === 'object') return category.id
            return category
          })
        : null

      const fetched = await payload.find({
        collection: 'products',
        depth: 1,
        limit,
        ...(flattenedCategories && flattenedCategories.length > 0
          ? {
              where: {
                categories: {
                  in: flattenedCategories,
                },
              },
            }
          : {}),
      })

      return {
        id: `${tab.id ?? `tab-${index}`}`,
        label: tab.label || (index === 0 ? 'All' : `Tab ${index}`),
        products: fetched.docs as Product[],
      }
    }),
  )

  // Always keep the first (All) tab, even if it is empty; drop other empty tabs.
  const nonEmptyTabs = tabsWithProducts.filter((tab, index) => tab.products.length > 0 || index === 0)

  return (
    <ProductListingClient
      sectionDescription={sectionDescription}
      heading={heading}
      enableSearch={enableSearch ?? undefined}
      tabs={nonEmptyTabs}
    />
  )
}

