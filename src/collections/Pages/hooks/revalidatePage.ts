import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Page } from '../../../payload-types'

// Helper to safely get revalidation functions in non-Next environments (e.g. scripts/tests)
const getRevalidateFunctions = () => {
  try {
    return require('next/cache')
  } catch (e) {
    return {
      revalidatePath: () => {},
      revalidateTag: () => {},
    }
  }
}

export const revalidatePage: CollectionAfterChangeHook<Page> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    if (doc._status === 'published') {
      const path = doc.slug === 'home' ? '/' : `/${doc.slug}`

      payload.logger.info(`Revalidating page at path: ${path}`)

      const { revalidatePath } = getRevalidateFunctions()
      revalidatePath(path)
      //revalidateTag('pages-sitemap')
    }

    // If the page was previously published, we need to revalidate the old path
    if (previousDoc?._status === 'published' && doc._status !== 'published') {
      const oldPath = previousDoc.slug === 'home' ? '/' : `/${previousDoc.slug}`

      payload.logger.info(`Revalidating old page at path: ${oldPath}`)

      const { revalidatePath } = getRevalidateFunctions()
      revalidatePath(oldPath)
      //revalidateTag('pages-sitemap')
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Page> = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    const path = doc?.slug === 'home' ? '/' : `/${doc?.slug}`
    const { revalidatePath } = getRevalidateFunctions()
    revalidatePath(path)
    //revalidateTag('pages-sitemap')
  }

  return doc
}
