import { Media } from '@/components/Media'
import { OrderStatus } from '@/components/OrderStatus'
import { Price } from '@/components/Price'
import { SaleBadge } from '@/components/SaleBadge'
import { SalePrice } from '@/components/SalePrice'
import { Button } from '@/components/ui/button'
import { Media as MediaType, Order, Product, Variant } from '@/payload-types'
import { formatDateTime } from '@/utilities/formatDateTime'
import { getEffectivePrice } from '@/utilities/saleEvents'
import Link from 'next/link'

type Props = {
  product: Product
  style?: 'compact' | 'default'
  variant?: Variant
  quantity?: number
  /**
   * Force all formatting to a particular currency.
   */
  currencyCode?: string
}

export const ProductItem: React.FC<Props> = ({
  product,
  style = 'default',
  quantity,
  variant,
  currencyCode,
}) => {
  const { title } = product

  const metaImage =
    product.meta?.image && typeof product.meta?.image !== 'string' ? product.meta.image : undefined

  const firstGalleryImage =
    typeof product.gallery?.[0]?.image !== 'string' ? product.gallery?.[0]?.image : undefined

  let image = firstGalleryImage || metaImage

  const isVariant = Boolean(variant) && typeof variant === 'object'

  if (isVariant) {
    const imageVariant = product.gallery?.find((item) => {
      if (!item.variantOption) return false
      const variantOptionID =
        typeof item.variantOption === 'object' ? item.variantOption.id : item.variantOption

      const hasMatch = variant?.options?.some((option) => {
        if (typeof option === 'object') return option.id === variantOptionID
        else return option === variantOptionID
      })

      return hasMatch
    })

    if (imageVariant && typeof imageVariant.image !== 'string') {
      image = imageVariant.image
    }
  }

  const priceInfo = getEffectivePrice(product)
  const { price: effectivePrice, originalPrice, isOnSale } = priceInfo
  
  // Use variant price if available, otherwise use effective price from sale calculation
  const itemPrice = variant?.priceInUSD || effectivePrice
  const itemOriginalPrice = variant?.priceInUSD || originalPrice
  const itemURL = `/products/${product.slug}${variant ? `?variant=${variant.id}` : ''}`

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-stretch justify-stretch h-20 w-20 p-2 rounded-lg border relative">
        <div className="relative w-full h-full">
          {image && typeof image !== 'string' && (
            <Media className="" fill imgClassName="rounded-lg object-cover" resource={image} />
          )}
        </div>
        
        {/* Sale Badge for non-variant products */}
        {!variant && isOnSale && itemOriginalPrice && (
          <SaleBadge
            originalPrice={itemOriginalPrice}
            salePrice={itemPrice}
            variant="corner"
            className="top-1 left-1"
          />
        )}
      </div>
      <div className="flex grow justify-between items-center">
        <div className="flex flex-col gap-1">
          <p className="font-medium text-lg">
            <Link href={itemURL}>{title}</Link>
          </p>
          {variant && (
            <p className="text-sm font-mono text-primary/50 tracking-widest">
              {variant.options
                ?.map((option) => {
                  if (typeof option === 'object') return option.label
                  return null
                })
                .join(', ')}
            </p>
          )}
          <div>
            {'x'}
            {quantity}
          </div>
        </div>

        {itemPrice && quantity && (
          <div className="text-right">
            <p className="font-medium text-lg">Subtotal</p>
            {!variant && isOnSale && itemOriginalPrice ? (
              <SalePrice
                salePrice={itemPrice * quantity}
                originalPrice={itemOriginalPrice * quantity}
                as="div"
                className="flex-col items-end gap-0"
                salePriceClassName="font-mono text-sm"
                originalPriceClassName="font-mono text-xs"
                currencyCode={currencyCode}
              />
            ) : (
              <Price
                className="font-mono text-primary/50 text-sm"
                amount={itemPrice * quantity}
                currencyCode={currencyCode}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
