import { getCachedGlobal } from '@/utilities/getGlobals'
import type { Category } from '@/payload-types'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import './index.css'
import { HeaderClient } from './index.client'

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
