import { cn } from '@/utilities/cn'
import React from 'react'
import { RichText } from '@/components/RichText'
import type { DefaultDocumentIDType } from 'payload'
import type { ContentBlock as ContentBlockProps } from '@/payload-types'

import { CMSLink } from '../../components/Link'

export const ContentBlock: React.FC<
  ContentBlockProps & {
    id?: DefaultDocumentIDType
    className?: string
  }
> = (props) => {
  const { columns } = props

  return (
    <div className="container my-8 md:my-12 lg:my-16">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-y-8 gap-x-8 lg:gap-x-16">
        {columns &&
          columns.length > 0 &&
          columns.map((col, index) => {
            const { enableLink, link, richText, size } = col

            return (
              <div
                className={cn(
                  size === 'full' ? 'col-span-1 sm:col-span-2 lg:col-span-12' : 'col-span-1 sm:col-span-2',
                  { 'lg:col-span-4': size === 'oneThird', 'lg:col-span-6': size === 'half', 'lg:col-span-8': size === 'twoThirds' },
                )}
                key={index}
              >
                {richText && <RichText data={richText} enableGutter={false} />}

                {enableLink && <CMSLink {...link} />}
              </div>
            )
          })}
      </div>
    </div>
  )
}
