'use client'

import { CreateAddressModal } from '@/components/addresses/CreateAddressModal'
import { Address } from '@/payload-types'
import { useAuth } from '@/providers/Auth'
import { cn } from '@/utilities/cn'
import { useAddresses } from '@payloadcms/plugin-ecommerce/client/react'
import { Check, Plus } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

type Props = {
  selectedAddress?: Address
  setAddressAction: (address: Partial<Address> | undefined) => void
  checkoutInitialData?: {
    firstName: string
    lastName: string
    phone: string
  }
}

export const CheckoutAddresses: React.FC<Props> = ({
  selectedAddress,
  setAddressAction,
  checkoutInitialData,
}) => {
  const { user } = useAuth()
  const { addresses: rawAddresses } = useAddresses()

  const addresses = React.useMemo(() => {
    if (!rawAddresses || !user) return []
    return rawAddresses.filter((address) => {
      const customerId =
        typeof address.customer === 'object' ? address.customer?.id : address.customer
      return String(customerId) === String(user.id)
    })
  }, [rawAddresses, user])

  if (!user) {
    return (
      <div className="p-8 border border-dashed border-border text-center space-y-4">
        <p className="text-sm text-muted-foreground">Please log in to use your saved addresses.</p>
        <Link
          href="/login"
          className="inline-block px-6 py-2 border border-foreground text-sm font-medium hover:bg-foreground hover:text-white transition-colors"
        >
          Log in
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Address Cards */}
      <div className="space-y-3">
        {addresses.length === 0 ? (
          <div className="p-8 border border-dashed border-border text-center space-y-4">
            <p className="text-sm text-muted-foreground">Add an address to continue checkout.</p>
          </div>
        ) : (
          addresses.map((address) => {
            const isSelected = selectedAddress?.id === address.id
            const title = address.title || 'Mr/Ms'
            const fullName = `${address.firstName ?? ''} ${address.lastName ?? ''}`.trim()
            const displayAddressLine = [address.addressLine1, address.addressLine2]
              .filter(Boolean)
              .join(', ')

            return (
              <div
                key={address.id}
                onClick={() => setAddressAction(address)}
                className={cn(
                  'flex items-start gap-5 p-5 border cursor-pointer transition-all',
                  isSelected
                    ? 'border-primary bg-white'
                    : 'border-border bg-white hover:border-primary/50',
                )}
              >
                {/* Selection Indicator */}
                <div
                  className={cn(
                    'w-5 h-5 shrink-0 flex items-center justify-center mt-0.5',
                    isSelected ? 'bg-primary' : 'border border-border',
                  )}
                >
                  {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                </div>

                {/* Address Info */}
                <div className="flex-1 space-y-1">
                  <p className="text-[15px] font-bold text-foreground">{fullName || title}</p>
                  <p className="text-[13px] text-muted-foreground">{address.phone}</p>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">
                    {displayAddressLine}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Add New Address Button */}
      <CreateAddressModal
        callback={(address) => {
          setAddressAction(address)
        }}
        buttonText="Add New Address"
        modalTitle="Add New Address"
        initialData={{
          firstName: checkoutInitialData?.firstName ?? '',
          lastName: checkoutInitialData?.lastName ?? '',
          phone: checkoutInitialData?.phone ?? '',
        }}
        trigger={
          <button className="w-full flex items-center justify-center gap-3 p-4 border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors">
            <Plus size={18} />
            <span className="text-sm font-semibold">Add New Address</span>
          </button>
        }
      />
    </div>
  )
}
