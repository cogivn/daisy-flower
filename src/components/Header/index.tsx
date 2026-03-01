import type { Category } from '@/payload-types'
import { getCachedGlobal } from '@/utilities/getGlobals'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { HeaderClient } from '@/components/Header/index.client'
import '@/components/Header/index.css'

export async function Header() {
  const header = await getCachedGlobal('header', 1)()

  const payload = await getPayload({ config: configPromise })
  const categoriesResult = await payload.find({
    collection: 'categories',
    depth: 0,
    limit: 100,
    pagination: false,
    sort: 'title',
    overrideAccess: true,
  })

  const categories = categoriesResult.docs as Category[]

  return <HeaderClient header={header} categories={categories} />
}
