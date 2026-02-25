import React from 'react'

import { CartModal, type CartModalProps } from './CartModal'
import { Cart as CartType } from '@/payload-types'

export type CartItem = NonNullable<CartType['items']>[number]

export function Cart(props: CartModalProps) {
  return <CartModal {...props} />
}
