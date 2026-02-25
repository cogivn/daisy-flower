import { cn } from '@/utilities/cn'
import React from 'react'

import type { Product } from '@/payload-types'

import { Card } from '../Card'

export type Props = {
  posts: Product[]
}

export const CollectionArchive: React.FC<Props> = (props) => {
  const { posts } = props

  return (
    <div className={cn('container')}>
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
          {posts?.map((result, index) => {
            if (typeof result === 'object' && result !== null) {
              return (
                <div key={index}>
                  <Card doc={result} />
                </div>
              )
            }

            return null
          })}
        </div>
      </div>
    </div>
  )
}
