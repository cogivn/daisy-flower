'use client'

import { AddressItem } from '@/components/addresses/AddressItem'
import { useAddresses } from '@payloadcms/plugin-ecommerce/client/react'
import React from 'react'

import { useAuth } from '@/providers/Auth'

export const AddressListing: React.FC = () => {
  const { user } = useAuth()
  const { addresses: rawAddresses } = useAddresses()

  const addresses = React.useMemo(() => {
    if (!rawAddresses || !user) return []
    return rawAddresses.filter((address) => {
      const customerId =
        typeof address.customer === 'object' ? address.customer?.id : address.customer
      return customerId === user.id
    })
  }, [rawAddresses, user])

  if (!addresses || addresses.length === 0) {
    return <p>No addresses found.</p>
  }

  return (
    <div>
      <ul className="flex flex-col gap-8">
        {addresses.map((address) => (
          <li key={address.id} className="border-b pb-8 last:border-none">
            <AddressItem address={address} />
          </li>
        ))}
      </ul>
    </div>
  )
}
