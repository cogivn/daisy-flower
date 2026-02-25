import clsx from 'clsx'
import { ShoppingCart } from 'lucide-react'
import React from 'react'

export function OpenCartButton({
  className,
  quantity,
  ...rest
}: {
  className?: string
  quantity?: number
}) {
  return (
    <span
      className={clsx(
        // Icon-only, no button chrome, no extra hover color
        'hidden lg:block relative',
        className,
      )}
      {...rest}
    >
      <ShoppingCart size={26} strokeWidth={1.5} />
      {typeof quantity === 'number' && quantity > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold">
          {quantity}
        </span>
      )}
    </span>
  )
}
