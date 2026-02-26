import type { Product, ProductListingBlock as ProductListingBlockProps } from '@/payload-types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { ProductListingClient } from './Component.client'

type Props = ProductListingBlockProps

export const ProductListingBlock: React.FC<Props> = async (props) => {
  const { sectionDescription, heading, enableSearch, tabs } = props

  const payload = await getPayload({ config: configPromise })

  const normalizedTabs = Array.isArray(tabs) && tabs.length > 0 ? tabs : []

  if (!normalizedTabs.length) {
    return null
  }

  const tabsWithProducts = await Promise.all(
    normalizedTabs.map(async (tab, index) => {
      const limit = typeof tab.limit === 'number' && tab.limit > 0 ? tab.limit : 8

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
        label: tab.label || `Tab ${index + 1}`,
        products: fetched.docs as Product[],
      }
    }),
  )

  const nonEmptyTabs = tabsWithProducts.filter((tab) => tab.products.length > 0)

  if (!nonEmptyTabs.length) {
    return null
  }

  return (
    <ProductListingClient
      sectionDescription={sectionDescription}
      heading={heading}
      enableSearch={enableSearch ?? undefined}
      tabs={nonEmptyTabs}
    />
  )
}

